export default (scrollTargetY = 0, speed = 2000, easing = 'easeOutSine', callback) => {
    // scrollTargetY: the target scrollY property of the window
    // speed: time in pixels per second
    // easing: easing equation to use

    window.requestAnimFrame = (function () {
      return  window.requestAnimationFrame ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame ||
              function(callback) {
                    window.setTimeout(callback, 1000 / 60);
              };
    })();

    const doc = document.documentElement;
    const scrollY = scrollY || (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);

    let currentTime = 0;

    // min time .1, max time .8 seconds
    const time = Math.max(.1, Math.min(Math.abs(scrollY - scrollTargetY) / speed, .8));

    // easing equations from https://github.com/danro/easing-js/blob/master/easing.js
    const PI_D2 = Math.PI / 2;

    const easingEquations = {
        easeOutSine(pos) {
            return Math.sin(pos * (Math.PI / 2));
        },
        easeInOutSine(pos) {
            return (-0.5 * (Math.cos(Math.PI * pos) - 1));
        },
        easeInOutQuint(pos) {
            if ((pos /= 0.5) < 1) {
                return 0.5 * (pos ** 5);
            }
            return 0.5 * ((pos - 2) ** 5 + 2);
        }
    };

    // add animation loop
    function tick() {
        currentTime += 1 / 60;

        const p = currentTime / time;
        const t = easingEquations[easing](p);

        if (p < 1) {
            window.requestAnimFrame(tick);

            window.scrollTo(0, scrollY + ((scrollTargetY - scrollY) * t));
        } else {
            window.scrollTo(0, scrollTargetY);
            callback();
        }
    }

    // call it once to get started
    tick();
}