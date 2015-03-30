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

  function Triangle (el, opts) {
    this.el = el;
    this.init(opts);
  }

  $.extend(Triangle.prototype, {
    init: function (opts) {
      var $el = $(this.el);
      var opts = this.opts = $.extend(true, null, Triangle.DEFAULT_OPTS, opts);

      if (this.opts.width) this.width = opts.width;
      else if (opts.fitElements === 'parent') {
        // tightest vertical fit
        var $parent = $el.parent();
        var w = $parent.width();
        var h = $parent.height();
        this.width = w+2*h/SQRT_3;
        $el.css({
          top: -w*SQRT_3/2, // h-this.width*SQRT_3/2
          left: -h/SQRT_3 // (w-this.width)/2
        });
      }
      else throw new Error("no width specified");

      var w2 = this.width/2;
      $el.addClass('triangle').css({
        borderWidth: ['0', (w2+1)+'px', (w2*SQRT_3+1)+'px'].join(' '), // FIXME: +1 hack to fix border, fix offsets too
      });

      var color = opts.color;
      if (color === 'random') color = $.randomColor;
      if (typeof color === 'function') color = color.call(this, this);
      if (color) {
        var chroma = '#000000';
        if (color === 'rgb(0, 0, 0)') chroma = '#FFFFFF';
        $el.css({
          borderBottomColor: color,
          _borderColor: [chroma, chroma, color, chroma].join(' '),
          _filter: "progid:DXImageTransform.Microsoft.Chroma(color='"+chroma+"')"
        });
      }
      return this;
    },
    divide: function (fn) {
      fn = typeof fn === 'number' ? Triangle.divide(fn) : fn;
      if (!fn || (typeof fn === 'function' && !fn.call(this, this))) return this;

      var $el = $(this.el);
      var opts = this.opts;
      var w2 = this.width/2;
      var w32 = w2*SQRT_3/2;

      $.each([
        {'class': 'triangle-top', css: {left: -w2/2}},
        {'class': 'triangle-middle', css: {top: w32, left: -w2/2}},
        {'class': 'triangle-left', css: {top: w32, left: -w2}},
        {'class': 'triangle-right', css: {top: w32}}
      ], function (_, division) {
        $('<div>')
          .appendTo($el)
          .addClass(division['class'])
          .css(division.css)
          [Triangle.NAME]($.extend(true, null, opts, {width: w2}))
          [Triangle.NAME]('divide', fn);
      });
      return this;
    },
    path: function () {
      var $el = $(this.el);
      return $el.add($el.parents('.triangle')).map(function () {
        return {
          el: this,
          side: (($(this).attr('class') || '').match(
            /(^| )triangle-(top|left|middle|right)( |$)/) || [])[2] || 'middle'
        };
      }).get();
    },
    inverted: function () {
      return !!(this.path().filter(function (p) { return p.side === 'middle'; }).length % 2);
    },

    /*
    03:38 <PlanckWalk> secrettriangle: Imagine you start with a triangle of unit side length
    03:39 <PlanckWalk> On the first subdivision, the smaller triangles have side length 1/2
    03:42 <PlanckWalk> sqrt(3)/6 distance from the center of the middle triangle
    03:44 <secrettriangle> I see that the "height" of each inner triangle is sqrt(3)/4, but I don't see how to continue that line into the center
    03:45 <PlanckWalk> secrettriangle: The center of each triangle is 1/3 of the way from the base to the point.
    03:46 <PlanckWalk> It's true of any triangle centroid
    03:47 <PlanckWalk> So the distance between two triangles sharing a common base is 2/3 their height.
    03:49 <PlanckWalk> secrettriangle: So the (first) top triangle center is offset by sqrt(3)/6 in the y direction // sqrt(3)/6 = sqrt(3)/(2*3) = 1/(2sqrt(3))
    03:50 <PlanckWalk> The right triangle center is at (1/4, sqrt(3)/12), and (-1/4, sqrt(3)/12) for the left
    03:59 <secrettriangle> OK so given the distance from a smaller triangle's center to its parent's center, how would I get the distance from the smaller triangle's center to its grandparent's center?
    04:02 <PlanckWalk> secrettriangle: Calculate the offset to the parent, add the parent's offset from the grandparent.
    04:03 <PlanckWalk> So you can start with offset (0,0), and "flipped" flag false.
    04:05 <PlanckWalk> Look at the 1st entry in your subdivision list.  Add the corresponding offset for the current side length.  If it was middle, set the "flipped" flag for future calculations, and proceed to the next entry.
    04:06 <PlanckWalk> Keep halving the side length, negating the offsets if flipped, and flipping the "flipped" flag if the subdivision was a middle triangle.
    */
    pos: function () {
      // maximal distance is 2/SQRT_3
      //   = top, top, top, ...
      //   = right, right, right, ...
      //   = left, left, left, ...

      var o = 1; // orientation -- either 1 or -1
      var p = {x: 0, y: 0};
      $.each(this.path(), function (i, ancestor) {
        var side = ancestor.side;
        var l = Math.pow(2, -i); // side length
        switch (side) {
          case 'middle':
            if (i) o *= -1;
            break;
          case 'top':
            p.y += o*l/SQRT_3;
            break;
          case 'left': case 'right':
            p.x += o*l*{left: -1, right: 1}[side]/2;
            p.y -= o*l/(2*SQRT_3);
            break;
        }
      });
      return p;
    }
  });

  $.extend(Triangle, {
    NAME: 'triangle',
    DEFAULT_OPTS: {
      width: null,
      fitElements: 'parent',
      color: 'random',
      divide: false // can also be a function that accepts a .triangle
    },

    divide: function (count) {
      return function (triangle) { return triangle.path().length < count; }
    }
  });


  $.randomByte = function () { return (Math.random() * 256) | 0; };
  $.randomColor = function () {
    return 'rgb('+[$.randomByte(), $.randomByte(), $.randomByte()].join(', ')+')';
  };

  // A really lightweight plugin wrapper around the constructor,
  // preventing against multiple instantiations
  $.fn[Triangle.NAME] = function (method) {
    var args = [].slice.call(arguments, 1);

    if (typeof method === 'object') {
      args.unshift(method);
      method = 'init';
    }

    var result = this;
    this.each(function () {
      var triangle = $.data(this, Triangle.NAME);
      if (!triangle && method === 'init') {
        triangle = new Triangle(this, args[0]);
        $.data(this, Triangle.NAME, triangle);
        return;
      }
      else if (!triangle) throw new Error("init first");
      else if (method === 'init') throw new Error("already inited");

      if (method === Triangle.NAME) {
        result = triangle;
        return false;
      }

      var methodResult = triangle[method].apply(triangle, args);
      if (methodResult !== triangle) {
        result = methodResult;
        return false; // break
      }
    });
    return result;
  };

  // TODO: propagate if mouse event is not directly on top of triangle, rather than its containing rectangle
  // $(document).on('mouseover', '.triangle', function (evt) {
  //   var $this = $(this);
  //   var offset = $this.offset();
  //   var x = evt.pageX - offset.left;
  //   var y = evt.pageY - offset.top;
  //   var triangle = $this.triangle('triangle');
  //   if (triangle.inverted() ?  triangle.width*2/SQRT_3)
  // });
}));
