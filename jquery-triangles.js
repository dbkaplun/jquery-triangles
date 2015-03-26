(function (factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('jquery'));
  } else {
    factory(jQuery);
  }
}(function ($, util) {
  var SQRT_3 = Math.sqrt(3);
  var DEFAULT_OPTS = {
    width: null,
    fitElements: 'parent',
    color: $.randomColor,
    divide: false // can also be a function that accepts a .triangle
  };

  $.fn.triangle = function (opts) {
    var self = this;
    opts = $.extend(true, null, DEFAULT_OPTS, opts);

    var tw;
    if (opts.width) tw = opts.width;
    else if (opts.fitElements === 'parent') {
      // tightest vertical fit
      var $parent = self.parent();
      var w = $parent.width();
      var h = $parent.height();
      tw = w+2*h/SQRT_3;
      self.css({
        top: -w*SQRT_3/2, // h-tw*SQRT_3/2
        left: -h/SQRT_3 // (w-tw)/2
      });
    }
    else throw new Error("no width specified");

    var w2 = tw/2;
    var color = typeof opts.color === 'function' ? opts.color(self) : opts.color;
    var chroma = '#000000';
    if (color === 'rgb(0, 0, 0)') chroma = '#FFFFFF';
    self.addClass('triangle').css({
      borderWidth: ['0', (w2+1)+'px', (w2*SQRT_3+1)+'px'].join(' '), // FIXME: +1 hack to fix border, fix offsets too
      borderBottomColor: color,
      _borderColor: [chroma, chroma, color, chroma].join(' '),
      _filter: "progid:DXImageTransform.Microsoft.Chroma(color='"+chroma+"')"
    });
    if (!opts.divide || (typeof opts.divide === 'function' && !opts.divide(self))) return self;
    var w32 = w2*SQRT_3/2;
    $.each([
      {'class': 'triangle-top', css: {left: -w2/2}},
      {'class': 'triangle-middle', css: {top: w32, left: -w2/2}},
      {'class': 'triangle-left', css: {top: w32, left: -w2}},
      {'class': 'triangle-right', css: {top: w32}}
    ], function (_, division) {
      $('<div>')
        .appendTo(self)
        .addClass(division['class'])
        .css(division.css)
        .triangle($.extend(true, null, opts, {width: w2}));
    });
    return self;
  };

  $.fn.triangleWidth = function () {
    if (!this.hasClass('triangle')) throw new Error("not a triangle");
    // return Number(this.css('borderLeftWidth').replace(/[a-z]/gi, '')) * 2;
    return parseInt(this.css('borderLeftWidth')) * 2;
  };

  $.randomByte = function () { return (Math.random() * 256) | 0; };
  $.randomColor = function () {
    return 'rgb('+[$.randomByte(), $.randomByte(), $.randomByte()].join(', ')+')';
  };

  return $.fn.triangle;
}));
