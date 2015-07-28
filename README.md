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
