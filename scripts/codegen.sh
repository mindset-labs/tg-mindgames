#!/bin/bash

echo "Generating for contracts..."

# Define directories to skip
SKIP_DIRS=("a" "b")

# Function to check if a directory should be skipped
should_skip() {
    local dir="$1"
    for skip in "${SKIP_DIRS[@]}"; do
        if [[ "$dir" == "$skip" ]]; then
            return 0  # True: should skip
        fi
    done
    return 1  # False: should not skip
}

# Loop through each directory in contracts/
for contract in ./contracts/*/; do
    if [ -d "$contract" ] && ! should_skip "$(basename "$contract")"; then
        echo "Generating schema for $(basename "$contract")..."
        (cd "$contract" && cargo schema)

        echo "Generating typescript code for $(basename "$contract")..."
        (
            ts-codegen generate \
                --plugin client \
                --schema "$contract/schema" \
                --out ./codegen \
                --name $(basename "$contract") \
                --no-bundle
        )
    fi
done

for package in ./packages/*/; do
    if [ -d "$package" ]; then
        echo "Generating schema for $(basename "$package")..."
        (cd "$package" && cargo schema)

        echo "Generating typescript code for $(basename "$package")..."
        (
            ts-codegen generate \
                --plugin client \
                --schema "$package/schema" \
                --out ./codegen \
                --name $(basename "$package") \
                --no-bundle
        )
    fi
done

echo "Codegen complete!"
