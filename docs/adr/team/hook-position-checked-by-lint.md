---
status: proposed
---

# Biome `useHookAtTopLevel`을 켜고, Root Component는 PascalCase로, 자식 Component는 `create<이름>`으로 짓습니다

> [!CAUTION]
> Root Component를 소문자로 시작하는 이름으로 지으면 Biome이 Component로 보지 않아, 클릭 함수 안에서 부른 `useState`를 잡지 못합니다.
