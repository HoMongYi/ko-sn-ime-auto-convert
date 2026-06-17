# SN 한/영 자동 변환(대문자)

바코드 리더기로 제품 S/N을 스캔할 때 Windows 입력 상태가 한글이어도 영문 S/N으로 자동 변환하고, 최종 값을 대문자로 정리하는 입력 보정 스크립트입니다.

## 데모 페이지 확인

아래 주소에서 데모 페이지를 바로 확인할 수 있습니다.

- 데모 URL: [https://homongyi.github.io/ko-sn-ime-auto-convert/demo.html](https://homongyi.github.io/ko-sn-ime-auto-convert/demo.html)

로컬에서 확인하려면 저장소를 내려받은 뒤 `demo.html`을 브라우저로 열면 됩니다.

## 파일 구성

- `sn-ime-auto-convert.js`: 운영 페이지에 적용할 핵심 스크립트
- `demo.html`: 기존 입력 방식과 자동 변환 입력을 비교하는 데모 페이지
- `sample-sn-barcode.png`: 스캔 테스트용 샘플 S/N 바코드 이미지
- `sample-sn-label.png`: CPU S/N 라벨 예시 이미지
  - CPU S/N 라벨 예시 이미지 출처: https://www.intel.com/content/www/us/en/support/articles/000006059/processors.html

## 주요 기능

- 한글 입력 상태로 스캔된 S/N을 영문 입력값으로 자동 변환합니다.
- 입력값은 영문과 숫자만 남기고 대문자로 정리합니다.
- 직접 입력, 바코드 스캔, 복사/붙여넣기 입력을 모두 같은 방식으로 처리합니다.
- 정리된 값은 실제 입력값에 반영되므로 복사해서 다른 곳에 붙여넣어도 대문자로 유지됩니다.
- 적용된 S/N 입력란 안에서만 동작하므로 페이지 전체 키 입력에는 영향을 주지 않습니다.

## 운영 페이지 적용 방법

운영 페이지에 `sn-ime-auto-convert.js`를 포함한 뒤, S/N 입력란 selector를 지정해서 적용합니다.

```html
<script src="./sn-ime-auto-convert.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    applySnImeAutoConvert('#Sno_001, #SnoChange_001');
  });
</script>
```

여러 행의 S/N 입력란에 한 번에 적용해야 하면 id prefix selector를 사용할 수 있습니다.

```html
<script src="./sn-ime-auto-convert.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function () {
    applySnImeAutoConvert('input[id^="Sno_"], input[id^="SnoChange_"]');
  });
</script>
```

동적으로 입력란을 새로 만든다면, 입력란을 화면에 추가한 뒤 `applySnImeAutoConvert()`를 다시 호출하면 됩니다. 이미 적용된 입력란은 중복 바인딩되지 않습니다.

## 동작 방식

- 한글 입력 상태로 들어온 두벌식 한글을 QWERTY 영문 키 입력으로 변환합니다.
- 영문/숫자만 남기고 나머지 문자는 제거합니다.
- 화면 표시뿐 아니라 실제 입력값도 대문자로 저장됩니다. 복사해서 다른 곳에 붙여넣어도 대문자로 유지됩니다. 예: `Ctrl + C`, `Ctrl + V`를 해도 `asdf`가 아닌 `ASDF`가 복사됩니다.
- 페이지 전체 키 입력은 감지하지 않고, 적용된 S/N 입력란 안에서만 동작합니다.

## 적용 대상

현재 운영 페이지의 S/N 입력란인 `Sno_001`, `SnoChange_001` 또는 같은 패턴의 입력란에 적용하면 됩니다.
