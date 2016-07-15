import React from 'react';
import ReactDOM from 'react-dom';

function getAverage(elements, number) {
  var sum = 0;

  //taking `number` elements from the end to make the average, if there are not enought, 1
  var lastElements = elements.slice(Math.max(elements.length - number, 1));

  for(var i = 0; i < lastElements.length; i++){
    sum = sum + lastElements[i];
  }

  return Math.ceil(sum / number);
}

const SectionsContainer = React.createClass({
  
  propTypes: {
    delay:                  React.PropTypes.number,
    verticalAlign:          React.PropTypes.bool,
    scrollBar:              React.PropTypes.bool,
    navigation:             React.PropTypes.bool,
    className:              React.PropTypes.string,
    sectionClassName:       React.PropTypes.string,
    navigationClass:        React.PropTypes.string,
    navigationAnchorClass:  React.PropTypes.string,
    navigationAnchorCircleClass: React.PropTypes.string,
    navigationAnchorActiveClass: React.PropTypes.string,
    activeClass:            React.PropTypes.string,
    sectionPaddingTop:      React.PropTypes.string,
    sectionPaddingBottom:   React.PropTypes.string,
    arrowNavigation:        React.PropTypes.bool,
    onSectionChange:        React.PropTypes.func
  },
  
  childContextTypes: {
     verticalAlign:          React.PropTypes.bool,
     sectionClassName:       React.PropTypes.string,
     sectionPaddingTop:      React.PropTypes.string,
     sectionPaddingBottom:   React.PropTypes.string,
  },
  
  getInitialState() {
    this.prevTime = new Date().getTime();
    this.scrollings = [];
    this.scrollingStarted = false;
    this.heightCache = {};

    return {
      activeSection: 0,
      sectionScrolledPosition: 0,
      windowHeight: window.innerHeight,
    };
  },
  
  getDefaultProps() {
    return {
      delay:                1000,
      verticalAlign:        false,
      scrollBar:            false,
      navigation:           true,
      className:            'SectionContainer',
      sectionClassName:     'Section',
      anchors:              [],
      activeClass:          'active',
      sectionPaddingTop:    '0',
      sectionPaddingBottom: '0',
      arrowNavigation:      true
    };
  },
  
  getChildContext() {
     return {
       verticalAlign:          this.props.verticalAlign,
       sectionClassName:       this.props.sectionClassName,
       sectionPaddingTop:      this.props.sectionPaddingTop,
       sectionPaddingBottom:   this.props.sectionPaddingBottom,
     };
  },
  
  componentWillUnmount() {
    this._detachScrollHandling();
  },
  
  componentDidMount() {
    window.addEventListener('resize', this._handleResize);
    
    if (!this.props.scrollBar) {
      this._attachScrollHandling();
    }
  },

  componentWillReceiveProps(nextProps) {
    if (this.props.scrollBar != nextProps.scrollBar) {
      // If the scrollBar prop changes, we need to remove/attach scroll behavior
      if (!nextProps.scrollBar) {
        this._attachScrollHandling();
      }
      else {
        this._detachScrollHandling();
        this._handleSectionTransition(0);
      }
    }
  },

  _attachScrollHandling() {
    this._addCSS3Scroll();
    this._handleAnchor(); //Go to anchor in case we found it in the URL

    window.addEventListener('hashchange', this._handleAnchor, false); //Add an event to watch the url hash changes
      
    if (this.props.arrowNavigation) {
      window.addEventListener('keydown', this._handleArrowKeys);
    }
  },

  _detachScrollHandling() {
    window.removeEventListener('resize', this._handleResize);
    window.removeEventListener('hashchange', this._handleAnchor);
    window.removeEventListener('keydown', this._handleArrowKeys);

    this._removeOverflowFromBody();
    this._removeHeightsFromParents();
    this._removeMouseWheelEventHandlers();
  },
  
  _addCSS3Scroll() {
    this._addOverflowToBody();
    this._addHeightToParents();
    this._addMouseWheelEventHandlers();
  },
  
  _addActiveClass() {
    this._removeActiveClass();
    
    let hash = window.location.hash.substring(1);
    let activeLinks = document.querySelectorAll(`a[href="#${hash}"]`);
    
    for( let i=0; i < activeLinks.length; i++) {
      activeLinks[i].className = activeLinks[i].className + (activeLinks[i].className.length > 0 ? ' ': '') + `${this.props.activeClass}`;
    }
    
    //console.log(allLinks);
  },
  
  _removeActiveClass() {
    let activeLinks = document.querySelectorAll(`a:not([href="#${this.props.anchors[this.state.activeSection]}"])`);
    
    for( let i=0; i < activeLinks.length; i++) {
      activeLinks[i].className = activeLinks[i].className.replace(/\b ?active/g, '');
    }
  },
  
  _addChildrenWithAnchorId() {
    var index = 0;
    return React.Children.map(this.props.children, function (child) {
      let id = this.props.anchors[index];
      index++;
      if (id) {
        return React.cloneElement(child, {
          id: id
        });
      } else {
        return child;
      }
    }.bind(this));
  },
  
  _addOverflowToBody() {
    const body = document.querySelector('body');
    this.previousBodyOverflow = body.style.overflow || 'initial';
    body.style.overflow = 'hidden';
  },

  _removeOverflowFromBody() {
    if (this.previousBodyOverflow) {
      document.querySelector('body').style.overflow = this.previousBodyOverflow;
    }
  },
  
  _addHeightToParents() {
    let child = ReactDOM.findDOMNode(this);
    let previousParent = child.parentNode;
    
    while (previousParent) {
      if ('style' in previousParent) {
        this.heightCache[previousParent] = previousParent.style.height;

        previousParent.style.height = '100%';
        previousParent = previousParent.parentNode;
      } else {
        return false;
      }
    }
  },

  _removeHeightsFromParents() {
    let child = ReactDOM.findDOMNode(this);
    let previousParent = child.parentNode;
    
    while (previousParent) {
      if ('style' in previousParent) {
        previousParent.style.height = this.heightCache[previousParent];
        previousParent = previousParent.parentNode;
      } else {
        return false;
      }
    }
  },
  
  _addMouseWheelEventHandlers() {
    window.addEventListener('wheel', this._mouseWheelHandler, false);
    window.addEventListener('mousewheel', this._mouseWheelHandler, false);
    window.addEventListener('DOMMouseScroll', this._mouseWheelHandler, false);
  },
  
  _removeMouseWheelEventHandlers() {
    window.removeEventListener('wheel', this._mouseWheelHandler);
    window.removeEventListener('mousewheel', this._mouseWheelHandler);
    window.removeEventListener('DOMMouseScroll', this._mouseWheelHandler);
  },
  
  _mouseWheelHandler(e) {
    // This logic is adapted from https://github.com/alvarotrigo/fullPage.js/blob/master/jquery.fullPage.js
    
    e         = e || window.event; // old IE support
    let value = e.wheelDelta || -e.deltaY || -e.detail;
	  let delta = Math.max(-1, Math.min(1, value));

    //Limiting the array to 150 (lets not waste memory!)
    if (this.scrollings.length > 149){
      this.scrollings.shift();
    }

    //keeping record of the previous scrollings
    this.scrollings.push(Math.abs(value));

    const curTime = new Date().getTime();
    const timeDiff = curTime - this.prevTime;
    this.prevTime = curTime;

    //haven't they scrolled in a while?
    //(enough to be consider a different scrolling action to scroll another section)
    if(timeDiff > 200){
      //emptying the array, we dont care about old scrollings for our averages
      this.scrollings = [];
    }

    const averageEnd = getAverage(this.scrollings, 10);
    const averageMiddle = getAverage(this.scrollings, 70);
    const isAccelerating = averageEnd >= averageMiddle;

    if (isAccelerating) {
      let position      = this.state.sectionScrolledPosition + (delta * this.state.windowHeight);
      let activeSection = this.state.activeSection - delta;
      let maxPosition   = 0 - (this.props.children.length * this.state.windowHeight);

      if (delta === 0 || position > 0 || maxPosition === position || this.scrollingStarted) {
        return;
      }

      let index = this.props.anchors[activeSection];
      if (!this.props.anchors.length || index) {
        window.location.hash = '#' + index;
      }
      
      this.scrollingStarted = true;

      this.setState({
        activeSection: activeSection,
        sectionScrolledPosition: position
      });

      this._invokeSectionChangeHandler(activeSection);
      
      setTimeout(() => {
        this.scrollingStarted = false;
      }, this.props.delay);
    }
  },
  
  _handleResize() {
    let position = 0 - (this.state.activeSection * window.innerHeight);
    this.setState({
      windowHeight: window.innerHeight,
      sectionScrolledPosition: position
    });
  },
  
  _handleSectionTransition(index) {
    let position = 0 - (index * this.state.windowHeight);
    
    if (!this.props.anchors.length || index === -1 || index >= this.props.anchors.length) {
      return false;
    }
    
    this.setState({
      activeSection: index,
      sectionScrolledPosition: position
    });
    this._invokeSectionChangeHandler(index);
  },
  
  _handleArrowKeys(e) {
    let event     = window.event ? window.event : e;
    let direction = event.keyCode === 38 || event.keyCode === 37 ? this.state.activeSection - 1 : (event.keyCode === 40 || event.keyCode === 39 ? this.state.activeSection + 1 : -1);
    let hash      = this.props.anchors[direction];
    
    if (!this.props.anchors.length || hash) {
      window.location.hash = '#' + hash;
    }
    
    this._handleSectionTransition(direction);
  },
  
  _handleAnchor() {
    let hash  = window.location.hash.substring(1);
    let index = this.props.anchors.indexOf(hash);
    
    this._handleSectionTransition(index);
    
    this._addActiveClass();
  },

  _invokeSectionChangeHandler(index) {
    const handler = this.props.onSectionChange;
    if (handler) {
      handler(index);
    }
  },
  
  renderNavigation() {
    let navigationStyle = {
      position:   'fixed',
      zIndex:     '10',
      right:      '20px',
      top:        '50%',
      transform:  'translate(-50%, -50%)',
    };
    
    const anchors = this.props.anchors.map((link, index) => {
      let anchorStyle = {
        display:          'block',
        margin:           '10px',
      };

      let circleStyle = {
        display:          'block',
        borderRadius:     '100%',
        backgroundColor:  '#556270',
        padding:          '5px',
        transition:       'all 0.2s',
        transform:        this.state.activeSection === index ? 'scale(1.3)' : 'none'
      };
      return (
        <a href={`#${link}`} key={index} className={(this.props.navigationAnchorClass || 'Navigation-Anchor') + ' ' + (this.state.activeSection === index ? (this.props.navigationAnchorActiveClass || 'Navigation-Anchor-Active') : '')} style={this.props.navigationAnchorClass ? null : anchorStyle}>
          <div className={this.props.navigationAnchorCircleClass || 'Navigation-Anchor-Circle'} style={this.props.navigationAnchorCircleClass ? null : circleStyle} />
        </a>
      );
    });
    
    return (
      <div className={this.props.navigationClass || 'Navigation'} style={this.props.navigationClass ? null : navigationStyle}>
        {anchors}
      </div>
    );
  },
  
  render() {
    let containerStyle = {
      height:     '100%',
      width:      '100%',
      position:   'relative',
      transform:  this.props.scrollBar ? 'none' : `translate3d(0px, ${this.state.sectionScrolledPosition}px, 0px)`,
      transition: `all ${this.props.delay}ms ease`,
    };
    return (
      <div>
        <div className={this.props.className} style={containerStyle}>
          {this.props.scrollBar ? this._addChildrenWithAnchorId() : this.props.children}
        </div>
        {this.props.navigation && !this.props.scrollBar ? this.renderNavigation() : null}
      </div>
    );
  },
  
});

export default SectionsContainer;
