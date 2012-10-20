/*
    Effecter（通过CSS3实现了滑动，翻页，立方体，格子，百叶窗，擦除，消退，交换特效）
*/

(function(global){
    //基础配置
    var IS_MOBILE = 'ontouchstart' in global,
        TOUCH_START = IS_MOBILE ? 'touchstart' : 'mousedown',
        TOUCH_MOVE = IS_MOBILE ? 'touchmove' : 'mousemove',
        TOUCH_END = IS_MOBILE ? 'touchend' : 'mouseup',
        BASE_CSS = {
            'width' : '100%',
            'height' : '100%',
            'position' : 'absolute',
            'left' : '0',
            'top' : '0' 
        },
        slice = Array.prototype.slice;

    //基础工具函数
    function isFunction() {
        return Object.prototype.toString.call(arguments[0]) === '[object Function]';
    }

    function css() {
        if (typeof arguments[1] === 'string') {
            return window.getComputedStyle(arguments[0],'')[arguments[1]];
        }
        
        for (var i in arguments[1]) {
            arguments[0].style[i] = arguments[1][i];
        }
    }
    
    function mix() {
        var arg, prop, temp = {};
        for (arg = 0; arg < arguments.length; arg++) {
            for (prop in arguments[arg]) {
                if (arguments[arg].hasOwnProperty(prop)) {
                    temp[prop] = arguments[arg][prop];
                }
            }
        }
        return temp;
    }
    
    function makeGrid(opt) {
        var forceSquare = opt['square'] || false,
            colCount    = opt['columns'] || 4,
            rowCount    = opt['rows'] || 4,
            cellWidth   = Math.floor(this.rootWidth / colCount),
            cellHeight  = Math.floor(this.rootHeight / rowCount);

        if (forceSquare) {
            cellHeight = cellWidth;
            rowCount   = Math.floor(this.rootHeight / cellHeight);
        }
            
        var colRemainder  = this.rootWidth - (colCount * cellWidth),
            colAddPreLoop = Math.ceil(colRemainder / colCount),
            rowRemainder  = this.rootHeight - (rowCount * cellHeight),
            rowAddPreLoop = Math.ceil(rowRemainder / rowCount),
            totalLeft     = 0,
            fragment      = document.createDocumentFragment();

        for (var i = 0; i < colCount; i++) {
            var thisCellWidth = cellWidth,
                totalTop      = 0;
            
            if (colRemainder > 0) {
                var add = colRemainder >= colAddPreLoop ? colAddPreLoop : colRemainder;
                thisCellWidth += add;
                colRemainder  -= add;
            }

            for (var j = 0; j < rowCount; j++) {
                var thisCellHeight       = cellHeight,
                    thisCellRowRemainder = rowRemainder;

                if (thisCellRowRemainder > 0) {
                    var add = thisCellRowRemainder >= rowAddPreLoop ? rowAddPreLoop : thisCellRowRemainder;
                    thisCellHeight       += add;
                    thisCellRowRemainder -= add;
                }

                var cell = document.createElement('div');
                cell.className = 'cell';
                css(cell, {
                    'width' : thisCellWidth + 'px',
                    'height' : thisCellHeight + 'px',
                    'position' : 'absolute',
                    'top' : totalTop + 'px',
                    'left' : totalLeft + 'px'
                });

                opt['decorate'].call(this, cell, {
                    'colIndex' : i,
                    'rowIndex' : j,
                    'cellWidth' : thisCellWidth,
                    'cellHeight' : thisCellHeight,
                    'totalLeft' : totalLeft,
                    'totalTop' : totalTop
                });
    
                fragment.appendChild(cell);
                
                totalTop += thisCellHeight;
            }
            totalLeft += thisCellWidth;
        }
        return fragment;
    }

    //特效集
    var effectSet = {

        scale : function(){
            var effectWrap = document.createElement('div');
            
            css(effectWrap, mix(BASE_CSS, {
                'background-image' : css(this.currentNode, 'background-image')
            }))

            this.currentNode.appendChild(effectWrap);

            arguments.callee.anim = function(arg){
                arg = (arg === undefined) ? 0.5 : arg;
                css(this.currentNode, { 'background-image' : 'none' });
                css(this.nextNode, { 'display' : 'none'});
                css(effectWrap, {
                    '-webkit-transform' : 'scale(' + arg + ')',
                    '-webkit-transition-duration' : this.duration
                });
            }.bind(this);
        },


        //滑动
        slide : function(){
            var effectWrap = document.createElement('div'),
                nodeWrap    = document.createElement('div'),
                node1       = document.createElement('div'),
                node2       = document.createElement('div');

            css(effectWrap, mix(BASE_CSS, { 'overflow' : 'hidden' }));
            css(nodeWrap, BASE_CSS);
            css(node1, mix(BASE_CSS, { 'background-image' : css(this.currentNode, 'background-image') }));
            css(node2, mix(BASE_CSS, {
                'background-image' : css(this.nextNode, 'background-image'),
                'left' : (this.direction === 'left' ? '' : '-') + this.rootWidth + 'px'
            }));
            
            nodeWrap.appendChild(node1);
            nodeWrap.appendChild(node2); 
            effectWrap.appendChild(nodeWrap);
            this.currentNode.appendChild(effectWrap); 

            //下面为两个钩子（hook）函数，一个绑定运动函数，一个绑定运动需要的参数值，这两个函数在触摸事件中要用到
            arguments.callee.anim = function(arg){
                arg = (arg === undefined) ? this.rootWidth : arg;

                css(nodeWrap, {
                    '-webkit-backface-visibility' : 'hidden',
                    '-webkit-transform' : 'translate(' + (this.direction === 'left' ? '-' : '') + arg + 'px)',
                    '-webkit-transition-duration' : this.duration
                })
            }.bind(this);
            
            arguments.callee.animArg = function(distance){ 
                return Math.abs(distance); 
            };
        },

        //格子
        blocks : function(){
            var effectWrap = document.createElement('div'),
                grid = makeGrid.call(this,{
                    'square' : true,
                    'columns' : 4,
                    'decorate' : function(cell,opt){
                        css(cell, {
                            'background-image' : css(this.currentNode, 'background-image'),
                            'background-position' : '-' + opt.totalLeft + 'px -' + opt.totalTop + 'px'
                        })
                    }.bind(this)
                });

            effectWrap.appendChild(grid); 
            this.currentNode.appendChild(effectWrap);
            
            //下面为钩子（hook）函数
            arguments.callee.anim = function(arg){
                arg = (arg === undefined) ? '0.4' : arg;
                
                css(this.currentNode, { 'background-image' : 'none' });
                
                slice.call(this.currentNode.querySelectorAll('.cell')).forEach(function(item){
                    css(item, {
                        'opacity' : '0',
                        '-webkit-transform' : 'scale(' + arg + ')',
                        '-webkit-transition-duration' : this.duration,
                        '-webkit-transition-delay' : Math.floor(Math.random() * 10 * 50) + 'ms'
                    });
                },this);
            }.bind(this);

            arguments.callee.clickTouch = true;
        },
       
        //翻页
        flip : function(){
            var cardWrap   = document.createElement('div'),
                frontNode  = document.createElement('div'),
                backNode   = document.createElement('div'),
                showNode   = document.createElement('div'),
                effectWrap = document.createElement('div');

            css(cardWrap, mix(BASE_CSS, {
                'width' : '50%',
                'left' : this.direction === 'left' ?  '50%' : '0',
                'z-index' : 101,
                '-webkit-transform-style' : 'preserve-3d',
                '-webkit-transform-origin' : this.direction === 'left' ? 'left center' : 'right center'
            }));
            css(frontNode, mix(BASE_CSS, {
                'background-image': css(this.currentNode, 'background-image'),
                'background-position': (this.direction === 'left' ?  '-' + this.rootWidth/2 : '0') + 'px 0',
                '-webkit-backface-visibility': 'hidden'
            }));
            css(backNode, mix(BASE_CSS, {
                'background-image': css(this.nextNode, 'background-image'),
                'background-position' : (this.direction === 'left' ?  '0' : '-' + this.rootWidth/2) + 'px 0',
                '-webkit-transform': 'rotateY(180deg)',
                '-webkit-backface-visibility': 'hidden'
            }));
            css(showNode, mix(BASE_CSS, {
                'left': this.direction === 'left' ?  '50%' : '0',
                'width': '50%',
                'background-image': css(this.nextNode, 'background-image'),
                'background-position': (this.direction === 'left' ?  '-' + this.rootWidth/2 : '0') + 'px 0 ',
                'z-index' : 100
            }));
            css(effectWrap, mix(BASE_CSS, { '-webkit-perspective': 1000 }));

            cardWrap.appendChild(frontNode);
            cardWrap.appendChild(backNode);
            effectWrap.appendChild(cardWrap);
            effectWrap.appendChild(showNode);
            this.currentNode.appendChild(effectWrap);

            //下面为两个钩子（hook）函数，一个绑定运动函数，一个绑定运动需要的参数值，这两个函数在触摸事件中要用到
            arguments.callee.anim = function(arg){
                arg = (arg === undefined) ? 180 : arg;
                
                css(cardWrap, {
                    '-webkit-transform' : 'rotateY(' + (this.direction === 'left' ? '-' :'')  + arg +'deg)',
                    '-webkit-transition-duration': this.duration
                })
            }.bind(this);
            arguments.callee.animArg = function(distance){
                return 180 / this.rootWidth * Math.abs(distance);
            }.bind(this);
        },

        //立方体
        cube : function(){
            var effectWrap  = document.createElement('div'),
                cubeWrap    = document.createElement('div'),
                currentFace = document.createElement('div'),
                nextFace    = document.createElement('div'),
                tz          = this.rootWidth / 2;

            css(effectWrap, mix(BASE_CSS, {
                '-webkit-perspective': 1000,
                '-webkit-perspective-origin': '50% 50%'
            }));
            css(cubeWrap, mix(BASE_CSS, {
                '-webkit-transform': 'translateZ(-' + tz + 'px)',
                '-webkit-transform-style': 'preserve-3d'
            }));
            css(currentFace, mix(BASE_CSS, {
                'background-image' : css(this.currentNode, 'background-image'),
                '-webkit-transform' : 'rotateY(0deg) translateZ(' + tz + 'px)',
                '-webkit-backface-visibility' : 'hidden'
            }));
            css(nextFace, mix(BASE_CSS, {
                'background-image' : css(this.nextNode, 'background-image'),
                '-webkit-transform' : 'rotateY(' + (this.direction === 'left' ? '' : '-') + '90deg) translateZ(' + tz + 'px)',
                '-webkit-backface-visibility' : 'hidden'
            }));

            cubeWrap.appendChild(currentFace);
            cubeWrap.appendChild(nextFace);
            effectWrap.appendChild(cubeWrap);
            this.currentNode.appendChild(effectWrap);
            
            //下面为两个钩子（hook）函数，一个绑定运动函数，一个绑定运动需要的参数值，这两个函数在触摸事件中要用到
            arguments.callee.anim = function(arg){
                arg = (arg === undefined) ? 90 : arg;
                
                css(this.currentNode, { 'background-image' : 'none' });
                css(this.nextNode, { 'display' : 'none' });
                css(cubeWrap, {
                    '-webkit-transform' : 'translateZ(-' + tz + 'px) rotateY(' + (this.direction === 'left' ? '-' : '') + arg + 'deg)',
                    '-webkit-transition-duration' : this.duration
                });
            }.bind(this);
            arguments.callee.animArg = function(distance){
                return 90 / this.rootWidth * Math.abs(distance);
            }.bind(this);
        },

        //百叶窗
        blinds : function(){
            var effectWrap = document.createElement('div'),
                grid = makeGrid.call(this,{
                    'columns' : 6,
                    'rows' : 1,
                    'decorate' : function(cell, opt){
                        var tile = document.createElement('div');

                        css(tile, mix(BASE_CSS, {
                            'width' : opt.cellWidth + 'px',
                            'height' : opt.cellHeight + 'px',
                            'background-image': css(this.currentNode, 'background-image'),
                            'background-position': '-' + opt.totalLeft + 'px -' + opt.totalTop + 'px',
                            'background-repeat': 'no-repeat',
                            '-webkit-backface-visibility': 'hidden'
                        }));

                        var tile2 = tile.cloneNode(false);
                        css(tile2, {
                            'background-image': css(this.nextNode, 'background-image'),
                            '-webkit-transform': 'rotateY(180deg)',
                            '-webkit-backface-visibility': 'hidden'
                        });
                        css(cell, {
                            '-webkit-transform-style': 'preserve-3d',
                            '-webkit-transition-delay': opt.colIndex * 100 + 'ms',
                        });

                        cell.appendChild(tile);
                        cell.appendChild(tile2);
                    }.bind(this)
                });

            effectWrap.appendChild(grid);
            this.currentNode.appendChild(effectWrap);

            //下面为钩子（hook）函数
            arguments.callee.anim = function(arg){
                arg = (arg === undefined) ? 180 : arg;
            
                css(this.currentNode, {
                    'background-image' : 'none',
                    '-webkit-perspective': 1000,
                    '-webkit-perspective-origin': '50% 50%'
                });
                css(this.nextNode, { 'display' : 'none' });

                slice.call(this.currentNode.querySelectorAll('.cell')).forEach(function(item){
                    css(item, {
                        '-webkit-transform' : 'rotateY(' + arg + 'deg)',
                        '-webkit-transition-duration': this.duration
                    });
                },this);
            }.bind(this);

            arguments.callee.clickTouch = true;
        },

        //擦除
        wipe : function(){
            var effectWrap = document.createElement('div');

            css(effectWrap, mix(BASE_CSS, {
                '-webkit-mask-image' : 'url(images/linewipe-mask.png)',
                '-webkit-mask-repeat' : 'no-repeat',
                '-webkit-mask-position' : '-1200px -400px',
                '-webkit-mask-size' : '1000px',
                '-webkit-transition-duration' : '1500ms',
                'background-image' : css(this.nextNode, 'background-image')
            }));

            this.currentNode.appendChild(effectWrap);

            arguments.callee.anim = function(arg){
                css(effectWrap, { '-webkit-mask-position' : '-300px -400px' });
            };

            arguments.callee.clickTouch = true;
        },

        //消退
        fade : function(){
            var effectWrap = document.createElement('div'),
                frontNode  = document.createElement('div'),
                backNode   = document.createElement('div');

            css(frontNode, mix(BASE_CSS, {
                'background-image' : css(this.currentNode, 'background-image'),
                'opacity' : 1,
                '-webkit-transform' : 'scale(1)',
                '-webkit-transition-duration' : '1500ms', 
                'z-index' : 101
            }));
            css(backNode, mix(BASE_CSS, {
                'background-image' : css(this.nextNode, 'background-image'),
                'z-index' : 100
            }));

            effectWrap.appendChild(frontNode);
            effectWrap.appendChild(backNode);
            this.currentNode.appendChild(effectWrap);

            arguments.callee.anim = function(arg){
                css(frontNode, {
                    '-webkit-transform' : 'scale(1.5)',
                    'opacity' : 0
                });
            };
            arguments.callee.clickTouch = true;
        },

        //交换
        swap : function(){
            var effectWrap = document.createElement('div'),
                frontNode  = document.createElement('div'),
                backNode   = document.createElement('div');

            css(frontNode, mix(BASE_CSS, {
                'background-image' : css(this.currentNode, 'background-image'),
                '-webkit-transition-duration' : '1000ms',
                '-webkit-transform' : 'translate3d(0,0,0)',
                'z-index' : 101
            }));
            css(backNode, mix(BASE_CSS, {
                'background-image' : css(this.nextNode, 'background-image'),
                '-webkit-transition-duration' : '1000ms',
                '-webkit-transform' : 'translate3d(0,0,-2000px)',
                'z-index' : 100
            }));
            css(effectWrap, mix(BASE_CSS, {
                '-webkit-transform-style': 'preserve-3d',
                '-webkit-perspective': 1000,
                '-webkit-perspective-origin': '50% 50%'
            }));

            effectWrap.appendChild(frontNode);
            effectWrap.appendChild(backNode);
            this.currentNode.appendChild(effectWrap);

            arguments.callee.anim = function(){
                css(this.currentNode, { 'background-image' : 'none' });
                css(this.nextNode, { 'display' : 'none' });
                css(frontNode, { '-webkit-transform' : 'translate3d(-250px,0,-1000px)' });
                css(backNode, { '-webkit-transform' : 'translate3d(250px,0,-1000px)' });

                setTimeout(function(){
                    css(frontNode, { '-webkit-transform' : 'translate3d(0,0,-2000px)' });
                    css(backNode, { '-webkit-transform' : 'translate3d(0,0,0)' });                    
                },800)
            };

            arguments.callee.clickTouch = true;
        }
    };

    //Effecter模块
    var Effecter =  function(config){
        if (!(this instanceof Effecter)) {
            return new Effecter(config);
        }

        this.init(config);
    };

    Effecter.prototype = {
        effects : {},

        //初始化
        init : function(config) {
            this.rootNode    = document.getElementById(config.container);
            this.rootWidth   = parseInt(css(this.rootNode, 'width'));
            this.rootHeight  = parseInt(css(this.rootNode, 'height'));
            this.resetConfig = config;
            this.autoPlay    = config.autoPlay; 
            this.duration    = config.duration; 
            this.maskImg     = config.maskImg; 
            this.direction   = config.direction || 'left';
            this.effectName  = config.effectName || 'slide';
            this.bgImgs      = config.bgImgs || [];    
            this.bgImgsCount = this.bgImgs.length;
            this.bgImgsIndex = 1;
            this.finishTouch = (this.autoPlay === true) ? true : false;
            
            //延迟注册需要实现的效果
            !isFunction(this.effects[this.effectName]) && this.register(this.effectName);
        },

        //重置
        reset : function() {
            this.init(this.resetConfig);
            this.begin();
        },

        //开始动画
        begin : function() {
            this.rootNode.firstElementChild && this.rootNode.removeChild(this.rootNode.firstElementChild);
            
            this.nodeWrap    = document.createElement('div');
            this.currentNode = document.createElement('div');
            this.nextNode    = document.createElement('div');

            //创建两个div（currentFace, nextFace）分别保存正显示的图片，和即将要显示的图片
            css(this.nodeWrap, mix(BASE_CSS, {
                'cursor' : 'move'
            }));
            css(this.currentNode, mix(BASE_CSS, {
                'z-index' : '101',
                'background-image' : 'url(images/' + this.bgImgs[0].name + ')'
            }));
            css(this.nextNode, mix(BASE_CSS, {
                'z-index' : '100',
                'background-image' : 'url(images/' + this.bgImgs[1].name + ')'
            }));


            this.nodeWrap.appendChild(this.currentNode);
            this.nodeWrap.appendChild(this.nextNode);
            this.rootNode.appendChild(this.nodeWrap);
            
            this.nodeWrap.addEventListener('webkitTransitionEnd', this.finish.bind(this), false);
            
            if (this.autoPlay) {
                this.run();
            }
            else {
                this.bindTouch(this.nodeWrap);   
            }
        },

        //动画结束之后执行
        finish : function() {
            //finishTouch用来判断基于触摸的结束事件，如果手指滑动超过半页距离，则finishTouch为true，因而执行后续的背景图置换操作
            if (this.finishTouch) {
                (this.bgImgsIndex += 1) >= this.bgImgsCount && (this.bgImgsIndex = 0);
           
                //重新配置(currentNode, nextNode)的背景图，方便实现轮询效果
                css(this.currentNode, { 'background-image' : css(this.nextNode, 'background-image') });
                css(this.nextNode, {
                    'display' : 'block',
                    'background-image' : 'url(images/' + this.bgImgs[this.bgImgsIndex].name + ')'
                });

                this.currentNode.firstElementChild && this.currentNode.removeChild(this.currentNode.firstElementChild);
            }
            
            //自动连续播放
            this.autoPlay && this.run();
        },

        //运行特效
        run : function() {
            var effectFn = this.effects[this.effectName];
            if (!isFunction(effectFn)) {
                throw new Error('不存在此效果！');
            }

            effectFn.call(this);
            if (this.autoPlay) {
                setTimeout(function(){ 
                    effectFn.anim.call(this); 
                }.bind(this), 1000);
            }
        },

        //绑定触摸相关的事件
        bindTouch : function(el) {
            var originLeft = 0,
                distance   = 0,
                stime      = 0,
                touchFlag  = false,
                effectFn = this.effects[this.effectName];

            var touchStart = function(event) {
                event.stopPropagation();

                this.duration  = '1ms';
                this.finishTouch = false;            
                touchFlag      = true;            
                originLeft     = event.clientX;
                stime          = Date.now();
                
                this.currentNode.firstElementChild === null && this.run();
            }.bind(this);
            
            var touchMove = function(event) {
                event.stopPropagation();

                if (touchFlag) {
                    distance = event.clientX - originLeft;
                    
                    //暂时只允许从左至右滑动
                    if (distance >= 0 ) return;

                    if (effectFn.clickTouch !== true) {
                        effectFn.anim.call(this, effectFn.animArg(distance));
                    }
                }
            }.bind(this);

            var touchEnd = function(event) {
                event.stopPropagation();
            
                touchFlag     = false;
                distance      = event.clientX - originLeft;
                this.duration = '800ms';

                //判断效果特性，是否触碰即可变换
                if (effectFn.clickTouch == true) {
                    this.finishTouch = true;
                    effectFn.anim.call(this);
                    return;
                }

                //暂时只允许从左至右滑动
                if (distance >= 0 ) return;

                //判断手指滑动是否超过半页距离
                if (Math.abs(distance) >= this.rootWidth/2 || ((Date.now() - stime) <= 250 && Math.abs(distance) >=20)) {
                    this.finishTouch = true;
                    effectFn.anim.call(this);
                }
                else {
                    this.finishTouch = false;
                    effectFn.anim.call(this, 0);
                }
            }.bind(this);

            el.addEventListener(TOUCH_START, touchStart, false);
            el.addEventListener(TOUCH_MOVE, touchMove, false);
            el.addEventListener(TOUCH_END, touchEnd, false);
        },

        //注册特效
        register : function(effect) {
            Effecter.prototype.effects[effect] = effectSet[effect];
        },

        //解除特效
        unregister : function(effect) {
            Effecter.prototype.effects[effect] = null;  
        }
    };

    global.Effecter = Effecter;
})(this);