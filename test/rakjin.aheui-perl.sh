DIR="$(pwd -P)"
TEST_ROOT=../../../
sudo cpan install
sudo cpan install Term::Encoding
echo '#!/bin/sh' > "$TEST_ROOT/aheui"
echo "perl -I \"$DIR/lib\" "$DIR/bin/aheui" \$1" >> "$TEST_ROOT/aheui"
chmod +x "$TEST_ROOT/aheui"
