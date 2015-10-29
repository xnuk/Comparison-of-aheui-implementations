# 아희 구현체 비교 테이블
[![Circle CI Build Status](https://circleci.com/gh/xnuk/Comparison-of-aheui-implementations/tree/master.svg?circle-token=6f0e887d35b8a8aaad3551529e7c5e452602cbfd)](https://circleci.com/gh/xnuk/Comparison-of-aheui-implementations/tree/master)

http://xnuk.github.io/Comparison-of-aheui-implementations

[aheui/snippets](https://github.com/aheui/snippets)로 테스트하는 구현체 비교

## 구현체를 추가해주세요!
### a. 근데 귀찮아요
[이슈](https://github.com/xnuk/Comparison-of-aheui-implementations/issues)를 넣어서 들어갔으면 하는 구현체를 말씀해주세요.

### b. 시간이 남아돌아요!
[test](/test) 폴더 안에 aheui 파일을 생성하는 .sh 파일을 작성하여 [Pull Request](https://github.com/xnuk/Comparison-of-aheui-implementations/pulls)를 넣어주세요.
- 파일명은 `user.repo.sh`가 됩니다. 이는

  ```bash
  git clone https://github.com/user/repo --depth=1 -b master && cd ./repo
  ```

  를 실행한 다음 `./user.repo.sh`를 실행한다는 의미가 됩니다.
  - 경우에 따라 `user.repo.sh.1`등으로 뒤에 숫자가 붙을 수 있는데, 이는 다른 환경에서 테스트를 해보고 싶은 경우, 예를 들어 Python의 경우 pypy와 cpython 두 가지를 놓고 테스트하고 싶은 경우 같을 때 사용할 수 있습니다.
    - 이 경우 파일 맨 윗줄에 `# description `으로 시작되는 설명 라벨을 적으셔야 합니다.
- 따라서 `user.repo.sh`가 실행되는 작업 폴더는 클론한 저장소의 폴더가 됩니다.
- `user.repo.sh`는 소스를 받은 직후에 딱 한 번만 실행됩니다.
- 작업 폴더 기준으로 실행 가능한 `../aheui` 파일을 만들어야 합니다. 이 파일은
  - 아희 소스 경로를 나타내는 한 가지 인자를 받습니다. (`../aheui foo/bar/baz.aheui`)
  - 필요에 따라 stdin이 주어질 수 있습니다. (`../aheui foo/bar/baz.aheui < bahmangheui.moe`)
    - stdin을 flush한 다음에 stdin을 입력 받아도 stdin을 다시 제공하지 않습니다.
  - 아희 소스의 실행결과를 stdout으로 출력해야 합니다.
- 또는 테스트 케이스 직전에 실행되는 `../aheui.pre.sh`와 테스트 케이스 직후에 실행되는 `../aheui.post.sh`를 만들어서 `../aheui` 파일을 생성하고 지울 수 있습니다.
  - `../aheui.pre.sh`와 `../aheui.post.sh`는 측정 시간에 들어가지 않습니다.
  - 두 파일 모두 아희 소스 경로를 나타내는 한 가지 인자만을 받습니다.
  - 컴파일러의 경우 이 기능을 유용하게 쓸 수 있습니다. 단 이 경우 `aheui.post.sh` 파일 안에 `rm ./aheui`를 넣어주는 게 심신건강에 좋습니다.
- 어쨌든 테스트 케이스 직전에 `../aheui` 파일이 있으면 됩니다.

## 직접 테스트를 해보고 싶어요!
현재 circle ci에서 테스트를 전부 도는 데에 걸리는 시간은 **40분** 정도입니다. 직접 테스트를 돌리실 때 `test/` 폴더에서 테스트하고 싶은 구현체의 스크립트를 제외한 나머지 부분은 미리 제거하시는 게 좋습니다.

테스트에 필요한 것들은 다음과 같습니다.
- [`time(1)`](http://man7.org/linux/man-pages/man1/time.1.html). 반드시 `/usr/bin/time`에 위치하여야 합니다. 부득이하게 위치하지 못할 시 [직접 찾아서 수정해주세요](https://github.com/xnuk/Comparison-of-aheui-implementations/blob/master/do).
- ruby 2.2 이상 (아마도?)
- gem
  - `ruby-xz`가 필요합니다. 설치해주세요.
- git
  - 당연히 있으실 겁니다.

그렇게 되었으면, `do` 파일이 있는 디렉터리에서 다음을 실행해줍니다:
```bash
git clone https://github.com/aheui/snippets --depth=1 -b master
./do # 이 파일은 루비 파일이라, ruby --version 쳤을 때 나오는 게 2.2 이상이 아니라면 직접 ruby2.2 ./do 처럼 실행하셔도 됩니다.
```

이렇게 하면 같은 폴더 안에 `data.json`이 생겼을 겁니다. 형식을 설명하자면:
- `data["_"]`: 빌드가 완료된 시간입니다. ISO 8601 형태로 되어 있습니다.
- `data["user/repo"]`: `user.repo.sh`의 실행 결과입니다. 테스트명을 키값으로 갖고 실행결과를 값으로 갖는 object입니다.
- `data["user/repo/num"]`: `user.repo.sh.num`의 실행 결과입니다. 여기서 `num`은 숫자를 의미합니다. `_`를 제외한 테스트명을 키값으로 갖고 실행결과를 값으로 갖는 object입니다.
  - `data["user/repo/num"]["_"]` `user.repo.sh.num`의 `# description` 항목입니다. 값은 줄바꿈 문자 없는 string입니다.
- 실행결과 값:
  - 숫자(`\d+(\.\d+)?`): 해당 테스트를 실행하는 데에 걸린 시간(초)입니다.
  - `false`: 해당 테스트가 예측한 결과값과 실제 결과값이 다른 경우입니다. (또는 exit code가 다른 경우입니다.)
  - `true`: 해당 테스트를 수행하는 시간이 120초보다 길어서 중간에 중단한 경우입니다.

이 json 파일을 가공해서 즐기시면 됩니다. npm을 설치하시고 다음 커맨드를 실행 시 가공한 html과 css를 즐기실 수 있습니다.
```bash
npm install stylus -g
npm install cleancss -g
npm install jade -g

jade -O ./data.json -o . ./index.jade

curl --get https://necolas.github.io/normalize.css/latest/normalize.css > ./normalize.css
stylus -o ./index.o.css ./index.styl
cat ./normalize.css ./index.o.css | cleancss -o ./index.css
rm ./index.o.css
rm ./normalize.css
```
