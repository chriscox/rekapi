var rekapiCSSContext = function (root, _) {

  'use strict';

  var Kapi = root.Kapi;

  var DEFAULT_GRANULARITY = 25;
  var STYLE_REMOVAL_BUFFER_MS = 100;


  // PRIVATE UTILITY FUNCTIONS
  //

  Kapi.prototype._contextInitHook.cssAnimate = function () {
    this.css = new CSSRenderer(this);
  };


  /*!
   * TODO: Reuse the core now function.
   * @return {number}
   */
  function now () {
    return +(new Date());
  }


  /*!
   * @return {string}
   */
  function getVendorPrefix () {
    var style = document.body.style;

    if ('-webkit-animation' in style) {
      return 'webkit';
    } else if ('-moz-animation' in style) {
      return 'mozilla';
    } else if ('-ms-animation' in style) {
      return 'microsoft';
    } else if ('-o-animation' in style) {
      return 'opera';
    } else if ('animation' in style) {
      return 'w3';
    }

    return '';
  }


  var styleID = 0;
  /*!
   * @param {string} css The css content that the <style> element should have.
   * @return {HTMLStyleElement} The unique ID of the injected <style> element.
   */
  function injectStyle (css) {
    var style = document.createElement('style');
    var id = 'rekapi-' + styleID++;
    style.id = id;
    style.innerHTML = css;
    document.body.appendChild(style);

    return style;
  }


  // CSS RENDERER OBJECT
  //

  /**
   * The `CSSRenderer` module allows you to run a Rekapi animation as a CSS `@keyframe` animation.  Standard Rekapi animations are powered by JavaScript, but in some cases using CSS `@keyframes` are more performant and therefore smoother.
   *
   * __Note!__ This is an experimental feature.  If you encounter any issues, please report them with the [Rekapi issue tracker](https://github.com/jeremyckahn/rekapi/issues?page=1&state=open).
   *
   * This module requires both the [`toCSS`](/dist/doc/ext/to-css/rekapi.to-css.js.html) and [`Kapi.DOMActor`](/dist/doc/ext/dom/rekapi.dom.actor.js.html) modules.  Functionally, `CSSRenderer` works by prerendering a CSS animation and injecting it into the DOM.  A standard Rekapi JavaScript-based animation computes the state on each tick.  You'll never have to call the `CSSRenderer` constructor explicitly, that is done for you when a Rekapi instance is initialized.
   *
   * An advantage of this module is that CSS animations are not always available, but JavaScript animations are.  You can choose what type of animation is appropriate at runtime:
   *
   * ```
   *  var kapi = new Kapi();
   *  var actor = new Kapi.DOMActor(document.getElementById('actor-1'));
   *
   *  kapi.addActor(actor);
   *  actor.keyframe(0,    { left: '0px'   });
   *  actor.keyframe(1000, { left: '250px' }, 'easeOutQuad');
   *
   *  if (kapi.css.canAnimateWithCSS()) {
   *    kapi.css.play();
   *  } else {
   *    kapi.play();
   *  }
   * ```
   *
   * __[Example](/ext/css-animate/sample/play-many-actors.html)__
   *
   * @param {Kapi} kapi
   * @constructor
   */
  Kapi.CSSRenderer = function (kapi) {
    if (!Kapi.DOMActor && !Kapi.prototype.toCSS) {
      throw 'CSSRenderer requires the DOMActor and toCSS modules.';
    }

    this.kapi = kapi;
    this.startingTime_ = 0;

    return this;
  };
  var CSSRenderer = Kapi.CSSRenderer;


  /*!
   * The HTMLStyleElement that was injected into the DOM.
   *
   * @private {HTMLStyleElement)
   */
  Kapi.CSSRenderer.prototype.styleElement_ = null;


  /**
   * Whether or not the browser supports CSS `@keyframe` animations.
   *
   * @return {boolean}
   */
  CSSRenderer.prototype.canAnimateWithCSS = function () {
    return !!getVendorPrefix();
  };


  /**
   * Play the Rekapi animation as a `@keyframe` animation.
   *
   * @param {number=} opt_iterations How many times the animation should loop.  This can be null or 0 if you want to loop the animation endlessly and also specify a granularity.
   * @param {number=} opt_granularity How precise the CSS animation should be.  The higher this number, the smoother the CSS animation will be, but the longer it will take to prerender.  The default value is 25.
   */
  CSSRenderer.prototype.play = function (opt_iterations, opt_granularity) {
    this.stop();

    var css = this.kapi.toCSS({
      'vendors': [getVendorPrefix()]
      ,'granularity': opt_granularity || DEFAULT_GRANULARITY
      ,'iterations': opt_iterations
    });

    this.styleElement_ = injectStyle(css);
    this.startingTime_ = now();

    if (opt_iterations) {
      var scheduledStyleRemoval =
          (opt_iterations * this.kapi.animationLength())
          + STYLE_REMOVAL_BUFFER_MS;

      setTimeout(
          _.bind(this.stop, this), scheduledStyleRemoval);
    }
  };


  /**
   * Stop an animation.  This also removes any `<style>` elements that were dynamically injected into the DOM.
   *
   * @param {boolean} opt_goToBeginning If true, reset the elements to their starting position when the animation completes.  If false or omitted, set inline styles on Actor elements to keep them in their ending position.
   */
  CSSRenderer.prototype.stop = function (opt_goToBeginning) {
    if (this.isPlaying()) {
      document.body.removeChild(this.styleElement_);
      this.styleElement_ = null;

      if (!opt_goToBeginning) {
        this.kapi.update(
             (now() - this.startingTime_) % this.kapi.animationLength());
      }
    }
  };


  /**
   * Whether or not a CSS animation is running.
   *
   * @return {boolean}
   */
  CSSRenderer.prototype.isPlaying = function () {
    return !!this.styleElement_;
  };

};
