---
status: proposed
---

# Patch를 누르면 테스트 영역의 HTML을 `<template>`로 읽습니다

> [!CAUTION]
> `<template>` 안에서는 스크립트가 실행되지 않고 이미지도 불러오지 않으므로, 문서에 붙은 요소로 읽으면 입력의 `<img onerror>`가 실행되고 이미지를 불러옵니다. jsdom은 이 차이를 재현하지 못해 테스트로 지키지 않습니다.

