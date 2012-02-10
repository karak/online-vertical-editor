
var isKanji = (function () {
  //utf-8
  var REGEXP = new RegExp();
  REGEXP.compile('[一-龠]+');
  return function (c) {
    return REGEXP.test(c);
  };
} ());

var KanjiState = function (onChanged) {
  var prev = undefined;

  this.read = function (c) {
    var current = isKanji(c);
    if (current !== prev) {
      onChanged(c, current);
    };
    prev = current;
  };
};

var RT_OPEN_HTML = '《', RT_CLOSE_HTML = '》';

var RubyFilter = function () {
    buffer = [];
    rubyBuffer = [],
             markedPlace = 0,
             markedTemporaly = true,
             isInRuby = false;

    this.write = function (c) {
        rubyBuffer.push(c);
        return this;
    };

    this.markHere = function (markTemporaly) {
        if (!isInRuby && markedTemporaly) {
            markedPlace = rubyBuffer.length;
            markedTemporaly = markTemporaly;
        }
        return this;
    };

    this.rubyStart = function () {
        if (isInRuby) throw 'already in ruby';

        //TODO: change internal-state
        rubyBuffer.splice(markedPlace, 0, '<ruby><rb>');
        rubyBuffer.push('</rb><rp>' + RT_OPEN_HTML + '</rp><rt>');
        isInRuby = true;
        return this;
    };

    var flush = function () {
        if (rubyBuffer.length > 0) {
            buffer.push(rubyBuffer.join(''));
            rubyBuffer = [];
        }
        markedPlace = 0;
        markedTemporaly = true;
    };

    this.rubyEnd = function () {
        if (!isInRuby) throw 'not yet in ruby';
        rubyBuffer.push('</rt><rp>' + RT_CLOSE_HTML + '</ruby>');
        flush(); /* force update*/
        isInRuby = false;
        return this;
    };

    this.flush = function () {
        if (isInRuby) throw 'now in ruby';
        flush();
        isInRuby = false;
        return this;
    };

    this.toString = function () {
        return buffer.join('') + rubyBuffer.join('');
    };
};

var AozoraLexer = function (handler) {

  var kanjiState = new KanjiState(function (c, isKanji) {
    handler.rubyTargetMarker(c, true);
  });

  this.readAll = function (text) {
    var i, c;
    for (i = 0; i < text.length; i += 1) {
      c = text[i];
      if (c.match(/[^｜《》]/)) {
        kanjiState.read(c);
      }
      switch (c) {
        case '｜':
          handler.rubyTargetMarker(c, false);
          break;
        case '《':
          handler.rubyStart(c);
          break;
        case '》':
          handler.rubyEnd(c);
          break;
        case '<':
          handler.lt(c);
          break;
        case '>':
          handler.gt(c);
          break;
        case 'amp':
          handler.amp(c);
          break;
        case '\t':
        case ' ':
          handler.sp(c);
          break;
        case '\n':
          handler.nl(c);
          break;
        default:
          handler.char(c);
          break;
      }
    }
  };
};

var aozoraToHtml = function (source) {
  var filter = new RubyFilter();

  var handler = {
    rubyTargetMarker: function (c, markTemporaly) { filter.markHere(markTemporaly); },
    rubyStart: function () { filter.rubyStart(); },
    rubyEnd: function () { filter.rubyEnd(); },
    nl: function () { filter.write('<br />').flush(); },
    lt: function () { filter.write('&lt;'); },
    gt: function () { filter.write('&gt;'); },
    sp: function () { filter.write('&nbsp;'); },
    amp: function () { filter.write('&amp;'); },
    char: function (c) { filter.write(c); }
  };
  new AozoraLexer(handler).readAll(source);
  return filter.toString();
};


