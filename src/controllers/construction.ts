import { Router } from "../deps/oak.ts"
import Nimiq from '../lib/nimiq_lib.ts'
import rpc from "../rpc.ts"
import {
    validateNetwork,
} from '../lib/validation.ts'
import {
    rpcTransationToRosetta,
} from '../lib/conversion.ts'

import type { Paths } from '../../types/rosetta.d.ts'
import type { NimiqRpc } from '../../types/nimiq_rpc.d.ts'

/**
 * Order of requests:
 * 1. /construction/derive
 * 2. /construction/preprocess
 * 3. /construction/metadata
 * 4. /construction/payloads
 * 5. /construction/parse
 * 6. /construction/combine
 * 7. /construction/parse (a 2nd time to make sure)
 * 8. /construction/submit
 *
 * Other endpoints:
 * - /construction/hash
 */

export default new Router()
    .post("/derive", async ({ request, response }) => {
        const req = await request.body().value as Paths.ConstructionDerive.RequestBody

        validateNetwork(req.network_identifier)

        if (req.public_key.curve_type !== 'edwards25519') {
            throw new Error('Unsupported curve')
        }

        const public_key = Nimiq.PublicKey.fromAny(req.public_key.hex_bytes)

        const result: Paths.ConstructionDerive.Responses.$200 = {
            account_identifier: {
                address: public_key.toAddress().toUserFriendlyAddress(),
            },
        }

        response.body = result
    })
    // /preprocess is called offline
    .post("/preprocess", async ({ request, response }) => {
        const req = await request.body().value as Paths.ConstructionPreprocess.RequestBody

        validateNetwork(req.network_identifier)

        const senderOperation = req.operations.filter(op => parseInt(op.amount?.value || '0') < 0)
        if (!senderOperation.length) {
            throw new Error('No sending operation found')
        }

        if (senderOperation.length !== 1) {
            throw new Error('More than one sending operation is not allowed')
        }

        if (!senderOperation[0].account) {
            throw new Error('No sending account found')
        }

        const result: Paths.ConstructionPreprocess.Responses.$200 = {
            required_public_keys: [
                senderOperation[0].account,
            ],
            ...(req.metadata?.data ? { options: { data: req.metadata.data } } : {}),
        }

        response.body = result
    })
    .post("/metadata", async ({ request, response }) => {
        const req = await request.body().value as Paths.ConstructionMetadata.RequestBody

        validateNetwork(req.network_identifier)

        const head = await rpc<NimiqRpc.Block>('getBlockByNumber', 'latest', false)

        const result: Paths.ConstructionMetadata.Responses.$200 = {
            metadata: {
                validity_start_height: head.number,
                ...(req.options?.data ? { data: req.options.data } : {}),
            },
        }

        response.body = result
    })
    .post("/payloads", async ({ request, response }) => {
        const req = await request.body().value as Paths.ConstructionPayloads.RequestBody

        validateNetwork(req.network_identifier)

        if (req.operations.length !== 2) {
            throw new Error(`Invalid number of operations, expected 2, got ${req.operations.length}`)
        }

        const senderOperation = req.operations.find(op => parseInt(op.amount?.value || '0') < 0)
        if (!senderOperation) {
            throw new Error('No sending operation found')
        }

        const recipientOperation = req.operations.find(op => parseInt(op.amount?.value || '0') > 0)
        if (!recipientOperation) {
            throw new Error('No receiving operation found')
        }

        if (!senderOperation.account) {
            throw new Error('No sending account found')
        }

        if (!recipientOperation.account) {
            throw new Error('No receiving account found')
        }

        if (req.public_keys?.length !== 1) {
            throw new Error('Sender public key is required')
        }

        if (!req.metadata || !req.metadata.validity_start_height) {
            throw new Error('Invalid metadata, expected validity_start_height')
        }

        const metadata = req.metadata as { validity_start_height: number, data?: string }

        const value = parseInt(recipientOperation.amount!.value)
        const fee = Math.abs(parseInt(senderOperation.amount!.value)) - value

        const sender_public_key = Nimiq.PublicKey.fromAny(req.public_keys[0].hex_bytes)
        const dummy_signature = new Nimiq.Signature(new Uint8Array(Nimiq.Signature.SIZE))

        let transaction: Nimiq.Transaction
        if (metadata.data) {
            transaction = new Nimiq.ExtendedTransaction(
                Nimiq.Address.fromAny(senderOperation.account.address), Nimiq.Account.Type.BASIC,
                Nimiq.Address.fromAny(recipientOperation.account.address), Nimiq.Account.Type.BASIC,
                value, fee,
                metadata.validity_start_height,
                Nimiq.Transaction.Flag.NONE,
                Nimiq.BufferUtils.fromAny(metadata.data),
                Nimiq.SignatureProof.singleSig(sender_public_key, dummy_signature).serialize(),
            )
        } else {
            transaction = new Nimiq.BasicTransaction(
                sender_public_key,
                Nimiq.Address.fromAny(recipientOperation.account.address),
                value,
                fee,
                metadata.validity_start_height,
                dummy_signature,
            )
        }

        const result: Paths.ConstructionPayloads.Responses.$200 = {
            unsigned_transaction: Nimiq.BufferUtils.toHex(transaction.serialize()),
            payloads: [
                {
                    account_identifier: senderOperation.account,
                    hex_bytes: Nimiq.BufferUtils.toHex(transaction.serializeContent()),
                    signature_type: 'ed25519',
                },
            ],
        }

        response.body = result
    })
    .post("/parse", async ({ request, response }) => {
        const req = await request.body().value as Paths.ConstructionParse.RequestBody

        validateNetwork(req.network_identifier)

        const transaction = Nimiq.Transaction.fromAny(req.transaction)

        const rosetta_transaction = rpcTransationToRosetta(transaction, false)

        const result: Paths.ConstructionParse.Responses.$200 = {
            operations: rosetta_transaction.operations,
            ...(req.signed ? {
                account_identifier_signers: [
                    {
                        address: transaction.sender.toUserFriendlyAddress(),
                    },
                ],
            } : {}),
            metadata: rosetta_transaction.metadata,
        }

        response.body = result
    })
    .post("/combine", async ({ request, response }) => {
        const req = await request.body().value as Paths.ConstructionCombine.RequestBody

        validateNetwork(req.network_identifier)

        const transaction = Nimiq.Transaction.fromAny(req.unsigned_transaction)
        const signature = Nimiq.Signature.fromAny(req.signatures[0].hex_bytes)

        if (transaction instanceof Nimiq.BasicTransaction) {
            transaction.signature = signature
        } else {
            const public_key = Nimiq.PublicKey.fromAny(req.signatures[0].public_key.hex_bytes)
            const signature_proof = Nimiq.SignatureProof.singleSig(public_key, signature)
            transaction.proof = signature_proof.serialize()
        }

        const result: Paths.ConstructionCombine.Responses.$200 = {
            signed_transaction: Nimiq.BufferUtils.toHex(transaction.serialize()),
        }

        response.body = result
    })
    .post("/submit", async ({ request, response }) => {
        const req = await request.body().value as Paths.ConstructionSubmit.RequestBody

        validateNetwork(req.network_identifier)

        // TODO: Use `pushTransaction` in Albatross to include mempool checks
        const hash = await rpc<string>('sendRawTransaction', req.signed_transaction)

        const result: Paths.ConstructionSubmit.Responses.$200 = {
            transaction_identifier: {
                hash,
            },
        }

        response.body = result
    })
    .post("/hash", async ({ request, response }) => {
        const req = await request.body().value as Paths.ConstructionHash.RequestBody

        validateNetwork(req.network_identifier)

        const transaction = Nimiq.Transaction.fromAny(req.signed_transaction)

        const result: Paths.ConstructionHash.Responses.$200 = {
            transaction_identifier: {
                hash: transaction.hash().toHex(),
            },
        }

        response.body = result
    })
