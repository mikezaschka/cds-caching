#!/bin/sh
set -eu

major="${CDS_MAJOR:?CDS_MAJOR is required}"

# CDS 8: full cds.deploy() to :memory: fails on CSV insert (resolve.transitions).
# CDS 9+: in-memory DB ensures a full schema deploy per cds.test() worker on Linux.
if [ "$major" = "8" ]; then
    npm pkg delete cds.requires.db.credentials -w cds-caching-test
    echo "CDS 8: test app uses file-based sqlite (no in-memory deploy)"
else
    npm pkg set 'cds.requires.db.credentials.url=:memory:' -w cds-caching-test
    echo "CDS ${major}: test app uses in-memory sqlite"
fi
