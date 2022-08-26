################################
# Base image for the other steps
################################
FROM ubuntu:22.04 as base

# Default version for node. Can be overriden during build
ARG NODE_VERSION=14.20.0

# Install packaged dependencies
RUN export DEBIAN_FRONTEND=noninteractive \
    && apt-get update \
    && apt-get -y install gpg curl xz-utils git-core \
    && rm -rf /var/lib/apt/lists/*

# Install node.js from the official source
RUN ARCH= && dpkgArch="$(dpkg --print-architecture)" \
    && case "${dpkgArch##*-}" in \
    amd64) ARCH='x64';; \
    ppc64el) ARCH='ppc64le';; \
    s390x) ARCH='s390x';; \
    arm64) ARCH='arm64';; \
    armhf) ARCH='armv7l';; \
    i386) ARCH='x86';; \
    *) echo "unsupported architecture"; exit 1 ;; \
    esac \
    # gpg keys listed at https://github.com/nodejs/node#release-keys
    && set -ex \
    && for key in \
    4ED778F539E3634C779C87C6D7062848A1AB005C \
    141F07595B7B3FFE74309A937405533BE57C7D57 \
    94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    74F12602B6F1C4E913FAA37AD3A89613643B6201 \
    71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    61FC681DFB92A079F1685E77973F295594EC4689 \
    8FCCA13FEF1D0C2E91008E09770F7A9A5AE15600 \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
    890C08DB8579162FEE0DF9DB8BEAB4DFCF555EF4 \
    C82FA3AE1CBEDC6BE46B9360C43CEC45C17AB93C \
    DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    A48C2BEE680E841632CD4E44F07496B3EB3C1762 \
    108F52B48DB57BB0CC439B2997B01419BD92F80A \
    B9E2F5981AA6E0CD28160D9FF13993A75599653C \
    ; do \
    gpg --batch --keyserver hkps://keys.openpgp.org --recv-keys "$key" || \
    gpg --batch --keyserver keyserver.ubuntu.com --recv-keys "$key" ; \
    done \
    && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-$ARCH.tar.xz" \
    && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
    && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
    && grep " node-v$NODE_VERSION-linux-$ARCH.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
    && tar -xJf "node-v$NODE_VERSION-linux-$ARCH.tar.xz" -C /usr/local --strip-components=1 --no-same-owner \
    && rm "node-v$NODE_VERSION-linux-$ARCH.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt \
    && ln -s /usr/local/bin/node /usr/local/bin/nodejs \
    # smoke tests
    && node --version \
    && npm --version


###################################
# Image for building the nimiq node
###################################
FROM base as nimiq-builder

# Default versions of yarn and nimiq's core-js. Can be overriden during build
ARG YARN_VERSION=1.22.19
ARG NIMIQ_VERSION=v1.5.8

RUN set -ex \
    && for key in \
    6A010C5166006599AA17F08146C2130DFD2497F5 \
    ; do \
    gpg --batch --keyserver hkps://keys.openpgp.org --recv-keys "$key" || \
    gpg --batch --keyserver keyserver.ubuntu.com --recv-keys "$key" ; \
    done \
    && curl -fsSLO --compressed "https://yarnpkg.com/downloads/$YARN_VERSION/yarn-v$YARN_VERSION.tar.gz" \
    && curl -fsSLO --compressed "https://yarnpkg.com/downloads/$YARN_VERSION/yarn-v$YARN_VERSION.tar.gz.asc" \
    && gpg --batch --verify yarn-v$YARN_VERSION.tar.gz.asc yarn-v$YARN_VERSION.tar.gz \
    && mkdir -p /opt \
    && tar -xzf yarn-v$YARN_VERSION.tar.gz -C /opt/ \
    && ln -s /opt/yarn-v$YARN_VERSION/bin/yarn /usr/local/bin/yarn \
    && ln -s /opt/yarn-v$YARN_VERSION/bin/yarnpkg /usr/local/bin/yarnpkg \
    && rm yarn-v$YARN_VERSION.tar.gz.asc yarn-v$YARN_VERSION.tar.gz \
    # smoke test
    && yarn --version

# Install build dependencies
RUN apt-get update \
    && apt-get --no-install-recommends -y install python3 build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create build directory
WORKDIR /build

RUN git clone --branch ${NIMIQ_VERSION} https://github.com/nimiq/core-js.git /build

# Install and build
RUN yarn --frozen-lockfile
RUN yarn install --frozen-lockfile --production


###################################
# Image for compiling rosetta-nimiq
###################################
FROM denoland/deno:1.24.3 as rosetta-builder

# Create build directory
WORKDIR /build

# NOTE: rosetta documentation claims we shouldn't copy anything from the local
# directory and should download it instead, but both the bitcoin and ethereum
# implementations do this.
COPY . .

# Compile
RUN deno compile --output /build/rosetta-nimiq --allow-net --allow-read src/mod.ts


#######################
# Final container image
#######################
FROM base

# Default operating mode
ENV MODE=offline

# Install supervisord to manage both processes (nimiq node and rosetta-nimiq)
RUN apt-get update \
    && apt-get --no-install-recommends -y install supervisor \
    && rm -rf /var/lib/apt/lists/*

# Create a non-privileged user which supervisord is going to use to run the services
RUN groupadd --gid 1000 nimiq \
    && useradd --uid 1000 --gid nimiq --shell /bin/bash --create-home nimiq

# Create data directory for state storage
RUN mkdir -p /data && chown nimiq:nimiq /data
VOLUME /data

# Create directory to store the apps (node and rosetta)
RUN mkdir /apps

# Copy production files into container image
COPY --from=nimiq-builder    /build/package.json /build/yarn.lock  /apps/core-js/
COPY --from=nimiq-builder    /build/node_modules                   /apps/core-js/node_modules
COPY --from=nimiq-builder    /build/*.md                           /apps/core-js/
COPY --from=nimiq-builder    /build/build                          /apps/core-js/build
COPY --from=nimiq-builder    /build/clients                        /apps/core-js/clients
COPY --from=nimiq-builder    /build/dist                           /apps/core-js/dist
COPY --from=nimiq-builder    /build/doc                            /apps/core-js/doc
COPY --from=rosetta-builder  /build/rosetta-nimiq                  /apps/rosetta-nimiq/rosetta-nimiq

COPY docker/supervisord.conf    /etc/supervisor/conf.d/supervisord.conf
COPY docker/start-nimiq.sh      /apps
COPY docker/config.mainnet.json /apps/rosetta-nimiq/config.mainnet.json

# Allow execution
RUN chmod 755 /apps/start-nimiq.sh

# rosetta-nimiq default port
EXPOSE 8080

ENTRYPOINT ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
