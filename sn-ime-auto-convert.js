(function (global) {
  'use strict';

  // 운영 페이지에서는 이 파일 하나만 포함한 뒤 applySnImeAutoConvert()를 호출하면 된다.

  // 두벌식 한글을 다시 QWERTY 키 입력으로 되돌리기 위한 기준표.
  // 예를 들어 한글 상태에서 a/b/c를 누르면 ㅁ/ㅠ/ㅊ이 되므로 다시 a/b/c로 매핑한다.
  var choseong = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  var jungseong = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  var jongseong = ['', 'ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  var keyMap = {
    'ㄱ':'r','ㄲ':'R','ㄳ':'rt','ㄴ':'s','ㄵ':'sw','ㄶ':'sg','ㄷ':'e','ㄸ':'E','ㄹ':'f','ㄺ':'fr','ㄻ':'fa','ㄼ':'fq','ㄽ':'ft','ㄾ':'fx','ㄿ':'fv','ㅀ':'fg','ㅁ':'a','ㅂ':'q','ㅃ':'Q','ㅄ':'qt','ㅅ':'t','ㅆ':'T','ㅇ':'d','ㅈ':'w','ㅉ':'W','ㅊ':'c','ㅋ':'z','ㅌ':'x','ㅍ':'v','ㅎ':'g',
    'ㅏ':'k','ㅐ':'o','ㅑ':'i','ㅒ':'O','ㅓ':'j','ㅔ':'p','ㅕ':'u','ㅖ':'P','ㅗ':'h','ㅘ':'hk','ㅙ':'ho','ㅚ':'hl','ㅛ':'y','ㅜ':'n','ㅝ':'nj','ㅞ':'np','ㅟ':'nl','ㅠ':'b','ㅡ':'m','ㅢ':'ml','ㅣ':'l'
  };

  function mergeOptions(options) {
    // S/N 입력용 기본값이다. 운영 쪽에서 허용 문자가 더 필요하면 options로 바꿀 수 있다.
    var merged = {
      uppercase: true,
      allowedPattern: /[^a-zA-Z0-9]/g,
      onChange: null,
      onStatus: null
    };

    options = options || {};
    Object.keys(options).forEach(function (key) {
      merged[key] = options[key];
    });

    return merged;
  }

  function isKoreanImeInput(value) {
    // 이미 input에 들어온 값 기준으로 한글 IME 상태였는지 판단할 때 사용한다.
    return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(value || '');
  }

  function isKoreanKeyEvent(event) {
    // 브라우저마다 한글 조합 키가 다르게 들어와서 가능한 신호를 같이 본다.
    return !!(
      (event.getModifierState && event.getModifierState('HangulMode')) ||
      event.key === 'Process' ||
      event.keyCode === 229 ||
      isKoreanImeInput(event.key || '')
    );
  }

  function convertKoreanImeToQwerty(value) {
    // 완성형 한글은 초성/중성/종성으로 풀어서 실제 눌린 영문 키를 이어 붙인다.
    var converted = '';
    value = value || '';

    for (var i = 0; i < value.length; i++) {
      var ch = value.charAt(i);
      var code = ch.charCodeAt(0) - 44032;

      if (code >= 0 && code <= 11171) {
        var cho = Math.floor(code / 588);
        var jung = Math.floor((code % 588) / 28);
        var jong = code % 28;
        converted += keyMap[choseong[cho]] || '';
        converted += keyMap[jungseong[jung]] || '';
        converted += keyMap[jongseong[jong]] || '';
      } else {
        converted += keyMap[ch] || ch;
      }
    }

    return converted;
  }

  function normalizeSerialValue(value, options) {
    // 붙여넣기, 스캔, 직접 입력 모두 최종적으로 이 경로에서 S/N 값으로 정리된다.
    var normalized = convertKoreanImeToQwerty(value).replace(options.allowedPattern, '');
    return options.uppercase ? normalized.toUpperCase() : normalized;
  }

  function setCursorEnd(input) {
    // 값이 자동 정리되면 커서가 중간으로 튀는 경우가 있어 끝으로 맞춘다.
    try {
      input.setSelectionRange(input.value.length, input.value.length);
    } catch (error) {}
  }

  function emitStatus(input, options, isKorean, rawValue, finalValue) {
    // 현재 입력 상태와 변환 결과를 외부로 전달한다.
    // isKorean: 한글 입력 상태였는지 여부, rawValue: 사용자가 실제로 입력한 값, finalValue: 영문/숫자/대문자로 정리된 최종 값
    var detail = {
      input: input,
      isKorean: isKorean,
      rawValue: rawValue,
      finalValue: finalValue
    };

    if (typeof options.onStatus === 'function') {
      options.onStatus(detail);
    }
  }

  function emitChange(input, options, isKorean, rawValue, finalValue) {
    // 입력값 변경 시 원본 값과 최종 S/N 값을 외부로 전달한다.
    var detail = {
      input: input,
      isKorean: isKorean,
      rawValue: rawValue,
      finalValue: finalValue
    };

    if (typeof options.onChange === 'function') {
      options.onChange(detail);
    }

    emitStatus(input, options, isKorean, rawValue, finalValue);

    try {
      input.dispatchEvent(new CustomEvent('sn-ime-auto-convert:change', { detail: detail }));
    } catch (error) {}
  }

  function normalizeInput(input, options, forcedKoreanStatus) {
    // 화면 스타일에 기대지 않고 input.value 자체를 저장될 값으로 바꾼다.
    var rawValue = input.value;
    var finalValue = normalizeSerialValue(rawValue, options);
    var isKorean = typeof forcedKoreanStatus === 'boolean' ? forcedKoreanStatus : isKoreanImeInput(rawValue);

    input.value = finalValue;
    setCursorEnd(input);
    emitChange(input, options, isKorean, rawValue, finalValue);
  }

  function stripPendingImeText(input, options) {
    // keydown에서 이미 영문 키를 넣었는데 IME가 뒤늦게 ㅇ 같은 조합 글자를 붙이는 경우를 정리한다.
    var rawValue = input.value;
    var finalValue = rawValue.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, '').replace(options.allowedPattern, '');
    input.value = options.uppercase ? finalValue.toUpperCase() : finalValue;
    setCursorEnd(input);
    emitChange(input, options, true, rawValue, input.value);
  }

  function getQwertyCharFromKey(event) {
    // 영문 상태에서는 event.key를 그대로 쓰고, 한글 조합 상태에서는 물리 키 위치(event.code)를 쓴다.
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return '';
    }

    if (/^[a-zA-Z0-9]$/.test(event.key)) {
      return event.key;
    }

    if (/^Key[A-Z]$/.test(event.code)) {
      return event.code.slice(3).toLowerCase();
    }

    if (/^Digit[0-9]$/.test(event.code) && !event.shiftKey) {
      return event.code.slice(5);
    }

    if (/^Numpad[0-9]$/.test(event.code)) {
      return event.code.slice(6);
    }

    return '';
  }

  function insertConvertedKey(input, event, options) {
    // 한글 모드에서 브라우저가 조합 문자를 만들기 전에 QWERTY 문자로 먼저 넣는다.
    var ch = getQwertyCharFromKey(event);
    if (!ch) {
      return false;
    }

    var isKorean = isKoreanKeyEvent(event);
    event.preventDefault();
    input.dataset.snImeComposing = '';
    input.dataset.snImeSuppressImeText = isKorean ? '1' : '';

    var start = input.selectionStart || 0;
    var end = input.selectionEnd || start;
    input.setRangeText(ch, start, end, 'end');
    normalizeInput(input, options, isKorean);
    return true;
  }

  function bindInput(input, options) {
    // 같은 입력란에 여러 번 적용해도 이벤트가 중복으로 붙지 않게 막는다.
    if (!input || input.dataset.snImeAutoConvertBound === '1') {
      return;
    }

    input.dataset.snImeAutoConvertBound = '1';

    input.addEventListener('keydown', function (event) {
      insertConvertedKey(input, event, options);
    });

    input.addEventListener('compositionstart', function () {
      input.dataset.snImeComposing = '1';
      if (input.dataset.snImeSuppressImeText === '1') {
        stripPendingImeText(input, options);
      }
    });

    input.addEventListener('compositionend', function () {
      input.dataset.snImeComposing = '';
      if (input.dataset.snImeSuppressImeText === '1') {
        stripPendingImeText(input, options);
        input.dataset.snImeSuppressImeText = '';
        return;
      }
      normalizeInput(input, options);
    });

    input.addEventListener('input', function (event) {
      if (input.dataset.snImeSuppressImeText === '1') {
        stripPendingImeText(input, options);
        return;
      }

      if (input.dataset.snImeComposing === '1' || event.isComposing || event.inputType === 'insertCompositionText') {
        emitStatus(input, options, true, input.value, input.value);
        return;
      }

      normalizeInput(input, options);
    });

    input.addEventListener('blur', function () {
      input.dataset.snImeComposing = '';
      input.dataset.snImeSuppressImeText = '';
      normalizeInput(input, options);
    });
  }

  function applySnImeAutoConvert(selector, options) {
    // 개발자나 전산팀에서 실제로 호출할 공개 함수. selector 문자열이나 input 엘리먼트를 모두 받을 수 있음.
    var resolvedOptions = mergeOptions(options);
    var inputs = typeof selector === 'string' ? document.querySelectorAll(selector) : selector;

    if (!inputs) {
      return [];
    }

    if (inputs.nodeType) {
      inputs = [inputs];
    }

    Array.prototype.forEach.call(inputs, function (input) {
      bindInput(input, resolvedOptions);
    });

    return inputs;
  }

  // 기존 페이지에서 바로 쓰기 쉽도록 전역 함수와 네임스페이스를 둘 다 노출한다.
  global.applySnImeAutoConvert = applySnImeAutoConvert;
  global.SnImeAutoConvert = {
    apply: applySnImeAutoConvert,
    convertKoreanImeToQwerty: convertKoreanImeToQwerty,
    normalizeSerialValue: function (value, options) {
      return normalizeSerialValue(value, mergeOptions(options));
    }
  };
})(window);