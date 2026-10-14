# Autopilot-landing

[AutoPilot](https://github.com/ReguMaster/Autopilot) 소개 페이지예요. 빌드 없이 정적 파일(`index.html`, `style.css`, `main.js`)로 동작해요.

## 로컬에서 보기

```sh
python -m http.server 8000
```

http://localhost:8000 을 열어요.

## 배포

저장소 Settings → Pages → Build and deployment에서 Source를 **Deploy from a branch**, Branch를 **main / (root)** 로 고르면 https://regumaster.github.io/Autopilot-landing/ 에 올라가요. 이후에는 main에 push할 때마다 다시 배포돼요.

- 주소가 바뀌면(사용자 도메인 등) `index.html`의 `canonical`, `og:url`, `og:image`를 함께 고쳐요.
- 공유 이미지 `assets/og.png`는 히어로를 1200x630으로 찍은 것이라, 히어로가 바뀌면 다시 만들어요.
- 스크린샷은 Autopilot 저장소의 `docs/screenshots`에서 가져왔어요.

## 움직임

`style.css` 아래쪽 "움직임" 절과 `main.js`에 있어요. 이동·확대 거리는 `--move`를 곱해 쓰고, OS의 움직임 줄이기 설정이 켜져 있으면 `--move`가 0이 되어 투명도·색 전환만 남아요.
