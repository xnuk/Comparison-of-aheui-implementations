sudo cpan install
sudo cpan install Term::Encoding
echo '#!/bin/sh' > ../aheui
echo 'perl -I ./aheui-perl/lib ./aheui-perl/bin/aheui $1' >> ../aheui
chmod +x ../aheui
