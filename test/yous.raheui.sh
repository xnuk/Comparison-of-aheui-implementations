DIR="$(pwd -P)"
TEST_ROOT=../../../
gem build raheui.gemspec
ln -s "$DIR/bin/raheui" "$TEST_ROOT/aheui"
