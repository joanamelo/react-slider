import React, { PureComponent } from 'react';

import scrollToY from './scrollTo';


class Slider extends PureComponent {
    constructor(props) {
        super(props);

        const { touchSensitivity, scrollingSpeed, className, scrollPendingThreshold } = this.props;

        this.onScroll = this.onScroll.bind(this);
        this.onLoad = this.onLoad.bind(this);
        this._currentSlide = 0;
        this.onTouchStart = this.onTouchStart.bind(this);
        this.preventBouncing = this.preventBouncing.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onResize = this.onResize.bind(this);
        this.state = {
            touchSensitivity: touchSensitivity || 5,
            scrollingSpeed: scrollingSpeed || 500,
            className: className || 'fullpage-slider',
            scrollPendingThreshold: scrollPendingThreshold || 200,
        };
    }

    componentDidMount() {
        this.updateSlidesOffsets();
        window.addEventListener('scroll', this.onScroll);
        window.addEventListener('load', this.onLoad);
        window.addEventListener('DOMContentLoaded', this.onLoad);
    }

    componentWillUnmount() {
        // unregister scroll events
        this.unblockScroll();

        // remove event listener for window resize
        window.removeEventListener('scroll', this.onScroll);
        window.removeEventListener('load', this.onLoad);
        window.removeEventListener('DOMContentLoaded', this.onLoad);
    }

    // pointer to the slides wrapper element
    setSlidesElem(elem) {
        this.slidesElem = elem;
    }

    render() {
        const { style } = this.props;
        const { className } = this.state;

        return (
            <div
                ref={ (elem) => this.setSlidesElem(elem) }
                style={ style }
                className={ className }>
                { this.props.children }
            </div>
        );
    }

    // when slides area is entered, prevent default behaviours and
    // add event listeners to make sliding scroll to slide
    blockScroll() {
        this.isBlocked = true;
        window.addEventListener('resize', this.onResize);
        if (window.addEventListener) { // older FF
            window.addEventListener('DOMMouseScroll', this.onScroll, false);
        }
        window.onwheel = this.onScroll; // modern standard
        window.onmousewheel = document.onmousewheel = this.onScroll; // older browsers, IE
        document.attachEvent && document.attachEvent('onmousewheel', this.onScroll); // IE 6/7/8
        window.ontouchstart = this.onTouchStart; // mobile
        document.addEventListener('touchmove', this.onTouchMove); // mobile
        document.addEventListener('touchmove', this.preventBouncing); // mobile
        window.ontouchmove = this.preventBouncing; // iOS

        // IE 11
        if (window.PointerEvent) {
            window.pointerdown = this.onTouchStart;
            window.pointermove = this.preventBouncing;
        } else {
            // IE < 11
            window.MSPointerDown = this.onTouchStart;
            window.MSPointerMove = this.preventBouncing;
        }

        document.onkeydown = this.onKeyDown;
        document.addEventListener('MozMousePixelScroll', this.onScroll); // firefox
    }

    // when leaving slides area, reset all event listeners
    // for sliding behaviour
    unblockScroll() {
        this.isBlocked = false;
        // cancel any pending scroll blocks
        this.scrollPending = false;
        document.removeEventListener('touchmove', this.onTouchMove); // mobile
        document.removeEventListener('touchmove', this.preventBouncing); // mobile
        window.removeEventListener('resize', this.onResize);
        if (window.removeEventListener) {
            window.removeEventListener('DOMMouseScroll', this.onScroll, false);
        }
        window.onmousewheel = document.onmousewheel = null;
        document.detachEvent && document.detachEvent('onmousewheel', this.onScroll); // IE 6/7/8
        window.onwheel = null;
        window.ontouchstart = null;
        window.ontouchmove = null;
        if (window.PointerEvent) {
            window.pointerdown = null;
            window.pointermove = null;
        } else {
            // IE < 11
            window.MSPointerDown = null;
            window.MSPointerMove = null;
        }

        document.onkeydown = null;
        document.removeEventListener('MozMousePixelScroll', this.onScroll);
    }

    // go one slide up if inside boundaries
    moveSlideUp() {
        // if in boundary slide, reallow normal scrolling
        if (this.currentSlide === 0) {
            this.unblockScroll();
            return;
        }

        this.moveToSlide(this.currentSlide - 1);
    }

    // go one slide down if inside boundaries
    moveSlideDown() {
        // if in boundary slide, reallow normal scrolling
        if (this.currentSlide >= this.props.total - 1) {
            this.unblockScroll();
            return;
        }

        this.moveToSlide(this.currentSlide + 1);
    }

    // infer from current scroll position which slide should be active
    // and move there
    moveToSlideInViewPort() {
        if (!this.slidesElem) {
            return;
        }

        let currentSlide = 0;
        // find out the initial page offset to infer the current slide
        const offset = this.slides[0] - this.slidesElem.getBoundingClientRect().top;

        // go through each slide to see if the scroll is over them
        while (currentSlide < (this.props.total - 1) && this.slides[currentSlide] < offset) {
            currentSlide += 1;
        }

        // check if the scroll position is nearer the slide up or down
        if (Math.abs(offset - this.slides[currentSlide]) > (window.innerHeight / 2)) {
            currentSlide -= 1;
        }

        this.moveToSlide(currentSlide);
    }

    // animation to move to indicated slide
    moveToSlide(idx) {
        const { scrollingSpeed, scrollPendingThreshold } = this.state;

        this.currentSlide = idx;

        scrollToY(this.slides[idx], scrollingSpeed, 'easeOutSine', () => {
            setTimeout(() => {
                // reallow new scrolling actions
                this.scrollPending = false;
            }, scrollPendingThreshold);
        });
    }

    // update each slide beginning position on resizes
    // or on each scroll on iOS, because the browser header
    // changes with scroll downs and ups
    updateSlidesOffsets() {
        const slides = [];

        for (let i = 0; i < this.props.total; i += 1) {
            slides.push(this.slidesElem.offsetTop + window.innerHeight * i);
        }

        this.slides = slides;
    }

    // setter for current active slide idx
    set currentSlide(idx) {
        const { notifyCurrent = () => {} } = this.props;

        this._currentSlide = idx;
        notifyCurrent(this._currentSlide);
    }

    // getter for current active slide idx
    get currentSlide() {
        return this._currentSlide;
    }

    // validate if viewport is completely in slides area
    isInViewPort() {
        if (!this.slidesElem) {
            return;
        }

        const slidesPosition = {
            start: Math.round(this.slidesElem.getBoundingClientRect().top),
            end: Math.round(this.slidesElem.getBoundingClientRect().bottom),
        };

        return (slidesPosition.start <= 0 && slidesPosition.end > window.innerHeight) ||
            (slidesPosition.start < 0 && slidesPosition.end >= window.innerHeight);
    }

    // onload event handler
    onLoad() {
        this.onInitialScroll();

        this.isInitialScroll = true;
    }

    // handler for events of any type of movement
    onMove(e) {
        e = e || window.event;
        // on any scroll/move, check if is inside slide area and block/unblock accordingly
        if (this.isInViewPort()) {
            // currently in slides, should prevent event normal behaviour
            this.preventDefault(e);

            if (!this.isBlocked) {
                this.blockScroll();

                this.moveToSlideInViewPort();
                this.isBlocking = true;
            }
        } else if (!this.isInViewPort()) {
            if (this.isBlocked) {
                this.unblockScroll();
            }

            return false;
        }

        return true;
    }

    // handle first scroll after load.
    // needed because safari mac calls onload too soon and
    // slides positioning is not final yet
    onInitialScroll() {
        this.updateSlidesOffsets();

        if (this.isInViewPort()) {
            // is inside slides area
            this.moveToSlideInViewPort();
        } else if (this.currentSlide === 0) {
            // if initial position is after slides, set currentSlide to last
            if (this.slidesElem.getBoundingClientRect().bottom < window.innerHeight) {
                this.currentSlide = this.props.total - 1;
            // regular initial position
            } else {
                this.currentSlide = 0;
            }
        }
    }

    // onscroll event handler
    onScroll(e) {
        if (this.isInitialScroll) {
            this.onInitialScroll();
            this.isInitialScroll = false;
        }

        if (!this.onMove(e)) {
            return;
        }

        if (this.scrollPending) {
            return;
        }

        // block subsequent scrolls while performing current one
        this.scrollPending = true;

        // cross-browser wheel delta
        const value = e.wheelDelta || -e.deltaY || -e.detail;

        // if detected scroll but no offset was obtained
        if (!value) {
            // if this event just got to slides area
            if (!this.isBlocking) {
                // cancel blocking subsequent scrolls
                this.scrollPending = false;
            }
            this.isBlocking = false;

            return;
        }

        this.isBlocking = false;

        const delta = Math.max(-1, Math.min(1, value));

        return delta > 0 ? this.moveSlideUp() : this.moveSlideDown();
    }


    // on key presses event to move between slides.
    // support for arrow down/up, page up/down and space bar
    onKeyDown(e) {
        const keys = [38, 33, 32, 40, 34];

        if (keys.indexOf(e.keyCode) <= -1) {
            return;
        }

        if (!this.onMove(e)) {
            return;
        }

        switch (e.keyCode) {
        case 38: // up
        // falls through
        case 33: // page up
            this.moveSlideUp();
            break;
        case 32: // space bar
        // falls through
        case 40: // down
        // falls through
        case 34: // page down
            this.moveSlideDown();
            break;
        default:
            return;
        }
    }

    // on window resizes event handler
    onResize() {
        this.updateSlidesOffsets();
    }

    // prevent iOS bouncing
    preventBouncing(e) {
        if (this.isBlocked) {
            // prevent easing on iOS devices
            this.preventDefault(e);
        }
    }

    // generic cross browser preventDefault behaviour
    preventDefault(e) {
        e = e || window.event;
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.returnValue = false;
    }

    // get a touch event x&y position
    touchEventPosition(e) {
        return {
            y: (typeof e.pageY !== 'undefined' && (e.pageY || e.pageX) ? e.pageY : e.touches[0].pageY),
            x: (typeof e.pageX !== 'undefined' && (e.pageY || e.pageX) ? e.pageX : e.touches[0].pageX),
        };
    }

    // ontouchstart event for touch screens
    onTouchStart(e) {
        this.preventDefault(e);
        this.startTouchPosition = this.touchEventPosition(e);
    }

    // evaluate a touchscreen touch for vertical direction and size
    // to decide if should move to another slide
    onTouchMove(e) {
        this.preventDefault(e);

        if (this.scrollPending) {
            return;
        }

        this.endTouchPosition = this.touchEventPosition(e);

        if (Math.abs(this.startTouchPosition.y - this.endTouchPosition.y) > (window.innerHeight / 100 * this.state.touchSensitivity)) {
            this.updateSlidesOffsets();
            if (this.startTouchPosition.y > this.endTouchPosition.y) {
                // block subsequent scrolls while performing current one
                this.scrollPending = true;
                this.moveSlideDown();
            } else if (this.endTouchPosition.y > this.startTouchPosition.y) {
                // block subsequent scrolls while performing current one
                this.scrollPending = true;
                this.moveSlideUp();
            }
        }
    }
}

Slider.propTypes = {
    style: React.PropTypes.object,
    scrollPendingThreshold: React.PropTypes.number,
    scrollingSpeed: React.PropTypes.number,
    total: React.PropTypes.number.isRequired,
    touchSensitivity: React.PropTypes.number,
    className: React.PropTypes.string,
    notifyCurrent: React.PropTypes.func,
    children: React.PropTypes.any,
};

export default Slider;
