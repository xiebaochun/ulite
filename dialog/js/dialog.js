/*
* Dialog component for jQuery ( AMD Module )
*
* Copyright (c) 2013-2014 Baochun Xie
* Released under the MIT Licenses
*
* Docs : https://github.com/xiebaochun/ecope/wiki/Dialog-%E5%AF%B9%E8%AF%9D%E6%A1%86
* Mail : xieperson@gmail.com
* Date : 2014-03-19
*/

define( [ '../../drag/js/drag' ], function(){

'use strict';

$.easing.easeIn = function(t){
    return t * t;
};

$.easing.easeOut = function(t){
    return ( 2 - t) * t;
};

$.easing.easeInStrong = function(t){
    return t * t * t * t;
};

$.easing.easeOutStrong = function(t){
    return 1 - (--t) * t * t * t;
};
    
var defaults = {
    autoClose  :   null,      // Number        自动关闭对话框的时间
    content    :   'Hello world : )',	  // String        对话框的内容(可以是HTML字符串)
    title      :   null,   	  // String        对话框的标题             
    yesText    :   '确定',	  // String        确定按钮的文本
    noText     :   '取消',	  // String        取消按钮的文本
    yesFn      :   null,	  // Function      确定按钮的回调(传了该参数才会显示确定按钮)
    noFn       :   null,	  // Function      取消按钮的回调(传了该参数才会显示确定按钮)
    width      :   '320px',   // String        设置对话框的宽度(须含单位)
    height     :   'auto',    // String        设置对话框的高度(须含单位)
    top        :   null,      // String        设置对话框的top位置值(须含单位)
    left       :   null,      // String        设置对话框的left位置值(须含单位)
    trigger    :   'click',   // String        触发显示对话框的事件类型
    overlay    :   true,	  // Boolean       是否添加遮罩层
    overlayClose :   false,	  // Boolean       是否点击遮罩层关闭对话框
    fixed      :   true,	  // Boolean       是否固定定位    
    lock       :   false,	  // Boolean       是否允许ESC键来关闭对话框
    effects    :   null,      // String        对话框关闭和显示的动画效果
    zIndex     :   9999,      // Number        遮罩层默认的zIndex值
    drag       :   true,      // Boolean       是否绑定拖拽功能
    topWindow  :   false,     // Boolean       设置对话框运行的窗口(在iframe中可以让对话框在顶级窗口中显示)
    elem       :   null,      // String|Element|easyJS Object 自定义对话框的HTML结构
    dragHandle :   null       // String|Element|easyJS Object 自定义对话框的拖拽区域
};

var isIE6 = $.browser.msie && $.browser.version === '6.0',
    overlayElem, dialogElem, btnYes, btnNo, btnClose, wrapElem, drag, timer, win, doc, docElem, body, $win, $doc, $body;
    
var easyDialog = {

    /*
     * 首字母大写转换
     * @param { String } 要转换的字符串
     * @return { String } 转换后的字符串 top => Top
     */    
    capitalize : function( str ){
        var firstStr = str.charAt(0);
        return firstStr.toUpperCase() + str.replace( firstStr, '' );
    },
    
    // 获取当前页面的尺寸
    getDocSize : function( name ){
        var upName = easyDialog.capitalize( name );
        
        return Math.max( docElem['scroll' + upName], docElem['client' + upName] );         
    },
    
    // 防止IE6的select穿透
    appendIframe : function( elem ){
        var html = '<iframe class="ecope_bg_iframe" frameborder="0" tabindex="-1" src="javascript:false;"' +
                        ' style="position:absolute;left:0;top:0;width:100%;height:100%;z-index:-1;border:0 none;filter:alpha(opacity=0)"/>',
			iframe;
        
        if( !elem.children('iframe.ecope_bg_iframe').length ){
			iframe = $( html, doc );
            elem.prepend( iframe );			
        }
	},  

    createOverlay : function( zIndex ){
        if( !overlayElem ){
			var html = '<div class="ecope_overlay" ' +
                'style="margin:0;padding:0;display:none;position:fixed;top:0;left:0;width:100%;height:100%;' + 
                'z-index:' + zIndex + '"/>';

			overlayElem = $( html, doc ).appendTo( $body );
				
            if( isIE6 ){             
                overlayElem.css( 'position', 'absolute' );
                easyDialog.appendIframe( overlayElem );
                // 修复IE6中只有iframe时无法点击遮罩层的BUG
                overlayElem.append( '<div style="position:absolute;left:0;top:0;width:100%;height:100%;z-index:1;" />' );
            }            
        }
    },
    
    createDialogBox : function( zIndex, overlay ){
        if( !dialogElem ){
			var html = '<div class="ecope_dialog" style="padding:0;display:none;z-index:' + zIndex + '"/>';
            dialogElem = $( html, doc );
            
            if( isIE6 && !overlay ){
                easyDialog.appendIframe( dialogElem );
            }
            $body.append( dialogElem );
        }
    },
    
    createDialogContent : function( o ){
        var children = dialogElem.children().last(),
            isShowBtnYes, isShowBtnNo, isShowFooter, title, html, btnNoCallback;
            
            

        if( o.elem ){
            if( children.length ){
                children.hide();
                $body.append( children );
            }      

            if( wrapElem ){
                wrapElem.remove();
                wrapElem = null;
            }            
            
            dialogElem.append( o.elem );
            o.elem.show();
            return;
        }

        isShowBtnYes = $.isFunction( o.yesFn );      
        isShowBtnNo = $.isFunction( o.noFn ) || o.noFn === true;           
        isShowFooter = isShowBtnYes || isShowBtnNo;
        
        btnNoCallback = function( e ){
            easyDialog.close( o );
            
            if( e ){
                e.preventDefault();
            }
        };      

        // 初次构建默认模板的HTML结构
        if( !wrapElem ){            
            html = '<div class="dg_wrapper">' + 
                        '<a href="###" class="dg_btn_close">&times;</a>' + 
                        '<div class="dg_header"' + ( o.title ? '' : ' style="display:none"' ) + '>' + o.title + '</div>' +
                        '<div class="dg_content">' + o.content + '</div>' +
                        '<div class="dg_footer"' + ( isShowFooter ? '' : ' style="display:none"' ) + '>' +
                            '<a href="###" class="dg_btn_no"' + ( isShowBtnNo ? '' : ' style="display:none"' ) + '>' + ( o.noText ) + '</a>' +
                            '<a href="###" class="dg_btn_yes"' + ( isShowBtnYes ? '' : ' style="display:none"' ) + '>' + ( o.yesText ) + '</a>' + 
                        '</div>' +
                    '</div>';
                        
            wrapElem = $( html, doc );       

            if( children.length ){
                children.hide();
                $body.append( children );
            }
            
            dialogElem.append( wrapElem );
            btnYes = wrapElem.find( 'a.dg_btn_yes' );
            btnNo = wrapElem.find( 'a.dg_btn_no' );
        }
        else{
            title = wrapElem.find( 'div.dg_header' );
            btnYes = wrapElem.find( 'a.dg_btn_yes' );
            btnNo = wrapElem.find( 'a.dg_btn_no' );
			
			wrapElem.find( 'div.dg_content' ).html( o.content );
            
            if( o.title ){
                title.html( o.title ).show();
            }
            else{
                title.hide();
            }		
			
            if( isShowBtnYes ){
                btnYes.text( o.yesText ).show();
                isShowFooter = true;
            }
            else{
                btnYes.hide();
            }
            
            if( isShowBtnNo ){
                btnNo.text( o.noText ).show();
                isShowFooter = true;
            }
            else{
                btnNo.hide();
            }            

            wrapElem.find( 'div.dg_footer' )[ isShowFooter ? 'show' : 'hide' ]();
        }       
        
        wrapElem.css({
            width : o.width, 
            height : o.height
        });
        
        if( isShowBtnYes ){
            btnYes.on( 'click.dialog', function( e ){                
                if( o.yesFn.call(dialogElem[0], e) !== false ){
                    easyDialog.close( o );
                }
                
                e.preventDefault();
            });
        }
        
        if( isShowBtnNo ){
            btnNoCallback = function( e ){     
                if( o.noFn.call(dialogElem[0], e) !== false ){
                    easyDialog.close( o );
                }

                if( this.href ){
                    e.preventDefault();
                }
            };            
            
            btnNo.on( 'click.dialog', btnNoCallback );
        }
        
        btnClose = wrapElem.find( 'a.dg_btn_close' );
        
        if( o.lock ){
            btnClose.hide();
        }
        else{
            btnClose.show();
            btnClose.on( 'click.dialog', btnNoCallback );           
        }
    },
    
    resize : function( e ){
        var o = e.data.o,
            winWidth = $win.width() / 2,
            winHeight = $win.height() / 2,
            cssMap = {}, 
            moveAnim;            
        
        if( isIE6 ){
            dialogElem[0].style.removeExpression( 'top' );
        }
        
        if( !o.fixed || isIE6 ){
            cssMap.top = winHeight + $win.scrollTop() + 'px';
            cssMap.left = winWidth + $win.scrollLeft() + 'px';            
        }
        else{
            cssMap.top = winHeight + 'px';
            cssMap.left = winWidth + 'px';                 
        }        
        
        moveAnim = function(){
            var dtd = new $.Deferred();
            
            if( o.effects ){
                dialogElem.animate( cssMap, function(){
                    dtd.resolve();
                });
            }
            else{
                dialogElem.css( cssMap );
                dtd.resolve();
            }
            
            return dtd.promise();
        };
        
        moveAnim().then(function(){
            // IE6需要重新设置遮罩层的尺寸
            if( o.overlay && isIE6 ){
                // 先将遮罩层的宽高设置成100%，可隐藏由于自身宽高超出窗口而产生的滚动条
                overlayElem.css({
                    width : '100%',
                    height : '100%'
                });   
                
                // 然后再将遮罩层的宽高设置成整个页面的宽高
                overlayElem.css({
                    width : easyDialog.getDocSize( 'width' ) + 'px',
                    height : easyDialog.getDocSize( 'height' ) + 'px'
                });        
            }
            
            easyDialog.bindExpression( o );
        });
    }, 
    
    setPosition : function( o ){ 
        var cssMap = {},
            winWidth = $win.width() / 2,
            winHeight = $win.height() / 2,
            elem = o.elem || wrapElem;
            
        if( !o.fixed || isIE6 ){      
            cssMap.position = 'absolute';
            cssMap.top = winHeight + $win.scrollTop() + 'px';
            cssMap.left = winWidth + $win.scrollLeft() + 'px';
        }
        else{                                           
            cssMap.position = 'fixed';
            cssMap.top = winHeight + 'px';
            cssMap.left = winWidth + 'px';             
        }

        cssMap.marginTop = '-' + ( elem.outerHeight() / 2 ) + 'px';
        cssMap.marginLeft = '-' + ( elem.outerWidth() / 2 ) + 'px';   
        
        if( o.top ){
            cssMap.top = o.top;
            cssMap.marginTop = '';
        }
        
        if( o.left ){
            cssMap.left = o.left;
            cssMap.marginLeft = '';
        }

        dialogElem.css( cssMap );        
    },
        
    bindExpression : function( o ){
        if( isIE6 && o.fixed ){
            if( docElem.currentStyle.backgroundAttachment !== 'fixed' ){
                docElem.style.backgroundImage = 'url(about:blank)';
                docElem.style.backgroundAttachment = 'fixed';
            }
            
            var expression = 'fuckIE6=document.documentElement.scrollTop+' + ( parseInt(o.top) || document.documentElement.clientHeight/2 ) + '+"px"';
            dialogElem[0].style.setExpression( 'top', expression );
        }
    },
    
    bindDrag : function( o ){
        if( o.drag ){
            var dragHandle = o.dragHandle || dialogElem.find( 'div.dg_header' );
            
            if( dragHandle.length && dragHandle.is(':visible') ){            
                drag = new $.ui.Drag( dialogElem, {
                    handle : dragHandle
                });
            }
        }
    },
    
    /*
     * 关闭/显示dialog的预定义的动画效果
     * @param { String } 动画效果的名称，有 fade、slide、zoom 三种效果
     * @param { Boolean } 是否反向动画(关闭时则为反向动画)
     * @return { Array } [ 动画对象, 完成动画后对dialog进行样式设置的对象 ]
     */
    patterns : function( effects, reverse ){
        var style = dialogElem[0].style,
            top = style.top,
            left = style.left,            
            
            FROM = 'from',
            TO = 'to',
            EASING = 'Out',
            
            isFixed = style.position === 'fixed',
            offset = dialogElem.offset(),
            currentTop = parseInt( top ),
            currentLeft = parseInt( left ),            
            
            originWidth = dialogElem.outerWidth(),
            originHeight = dialogElem.outerHeight(),    
            
            animMap = {},             
            
            completeMap = {
                opacity : '',
                width : '',
                height : '',
                overflow : '',                
                top : top,    
                left : left           
            },
            
            scrollTop;
        
        // 反向动画时直接将 from的动画对象和to的动画对象对调
        if( reverse ){
            FROM = 'to';
            TO = 'from';
            EASING = 'In';
            completeMap.display = 'none';
        }
            
        switch( effects ){
            case 'fade' :
                animMap[ FROM ] = { 
                    opacity : '0',
                    top : currentTop - 50 + 'px'
                };
                
                animMap[ TO ] = { 
                    opacity : '1',
                    top : currentTop + 'px' 
                };
                animMap.duration = 200;                
            break;    
            
            case 'slide' :
                scrollTop = isFixed ? 0 : $win.scrollTop();
                animMap[ FROM ] = { top : scrollTop - originHeight / 2 + 'px' };
                animMap[ TO ] = { top : currentTop + 'px' };
                animMap.easing = 'ease' + EASING + 'Strong';
            break;

            case 'zoom' :
                animMap[ FROM ] = {
                    opacity : '0',
                    left : currentLeft + originWidth / 2 + 'px',
                    top : currentTop + originHeight / 2 + 'px',
                    width : '0px',
                    height : '0px'
                };
                
                animMap[ TO ] = {          
                    opacity : '1',
                    left : currentLeft + 'px',
                    top : currentTop + 'px',
                    width : originWidth + 'px',
                    height : originHeight + 'px'
                };
                
                animMap.duration = 200; 
                animMap.easing = 'ease' + EASING;
            break;    
        }

        return [ animMap, completeMap ];
    },
    
    open : function( o ){
        var effects = o.effects,
            showOverlay,
            
            complete = function( cssMap ){
                return function(){
                    dialogElem.css( cssMap );                    
                    easyDialog.bindExpression( o );                    
                    easyDialog.bindDrag( o );
                    
                    if( !o.elem ){
                        if( btnYes.is(':visible') ){
                            btnYes[0].focus();
                        }
                    }
                    
                    if( !o.top && !o.left ){
                        $win.on( 'resize.dialog', { o : o }, easyDialog.resize );
                    } 

                    o.target.trigger( 'likeopen' );
                };
            };
            
        // 动画效果显示对话框
        if( effects ){
            showOverlay = function(){
                var dtd = $.Deferred(),
                    opacity = overlayElem.css( 'opacity' );
                
                if( o.overlay ){                    
                    overlayElem.css({
                            visibility : '',
                            opacity : '0'
                        })
                        .animate({opacity : opacity}, 200, function(){
                            dtd.resolve();
                        });       
                }
                else{
                    dtd.resolve();
                }
                
                return dtd.promise();
            };
            
            showOverlay().then(function(){               
                var result = easyDialog.patterns( effects, false ),
                    animMap = result[0];
                
                animMap.complete = complete( result[1] );

                dialogElem.css({
                        visibility :  '',
                        overflow : effects === 'zoom' ? 'hidden' : ''
                    })
                    .css( animMap['from'] )
                    .animate( animMap['to'], animMap.duration, animMap.easing, animMap.complete );                
            });           
        }
        // 直接显示对话框
        else{
            if( o.overlay ){
                overlayElem.css( 'visibility', '' );
            }

            complete({ visibility : '' })();
        }
    },
    
    close : function( o ){        
        var effects = o.effects,
            hideDialog;
            
        if( timer ){
            clearTimeout( timer );
            timer = null;
        }
            
        // 还原IE6模拟fixed效果修改的样式
        if( isIE6 && o.fixed ){
            dialogElem[0].style.removeExpression( 'top' );
            docElem.style.backgroundImage = '';
			docElem.style.backgroundAttachment = '';
        } 
            
        // 动画效果关闭对话框    
        if( effects ){            
            hideDialog = function(){                
                var dtd = $.Deferred(),
                    result = easyDialog.patterns( effects, true ),
                    animMap = result[0];
                    
                animMap.complete = function(){
                    dialogElem.css( result[1] );
                    dtd.resolve();
                };

                dialogElem.css( 'overflow', effects === 'zoom' ? 'hidden' : '' )
                    .css( animMap['from'] )
                    .animate( animMap['to'], animMap.duration, animMap.easing, animMap.complete );
                    
                return dtd.promise();
            };
            
            hideDialog().then(function(){
                if( o.overlay ){
                    var opacity = overlayElem.css( 'opacity' );  
                
                    overlayElem.animate({ opacity : '0' }, 200, function(){
                        overlayElem.css({
                            display : 'none',
                            opacity : opacity
                        });

                        if( o.elem ){
                            o.elem.hide();
                        }    
                    });                        
                }        
            });            
        }
        // 直接关闭对话框
        else{
            overlayElem.hide();
            dialogElem.hide();

            if( o.elem ){
                o.elem.hide();
            }                    
        }

        if( drag ){
            drag.destroy();
            drag = null;
        }        

        if( wrapElem ){
            btnYes.off( 'click.dialog' );
            btnNo.off( 'click.dialog' );
            btnClose.off( 'click.dialog' );
        }
        
        $win.off( 'resize.dialog' );
        $doc.off( 'keyup.dialog' );
        
        if( o.overlayClose ){
            overlayElem.off( 'click.dialog' );
        }
        
        o.target.trigger( 'likeclose' );
    },
    
    init : function( o, target ){    
        // 页面中始终只有一个dialog
        if( dialogElem && dialogElem.length && dialogElem.is(':visible') ){        
            overlayElem.hide();
            dialogElem.hide();
        }
        
        easyDialog.createOverlay( o.zIndex );	
        easyDialog.createDialogBox( o.zIndex + 1, o.overlay );    
        easyDialog.createDialogContent( o );

        if( o.overlay ){
            overlayElem.css({
                visibility : 'hidden', 
                display : 'block'
            });    
            
            if( o.overlayClose ){
                overlayElem.on( 'click.dialog', function(){
                    easyDialog.close( o );
                });
            }
            
            // ie6不对遮罩层进行固定定位
            if( isIE6 ){
                overlayElem.css({
                    width : easyDialog.getDocSize( 'width' ) + 'px',
                    height : easyDialog.getDocSize( 'height' ) + 'px'
                });             
            }
        }
        
        dialogElem.css({
            visibility : 'hidden', 
            display : 'block'
        });

        easyDialog.setPosition( o );       
        easyDialog.open( o ); 
        
        if( !o.lock ){
            // esc键绑定关闭对话框
            $doc.on( 'keyup.dialog', function( e ){
                if( e.which === 27 ){
                    easyDialog.close( o );
                }
            });
        }
        
        // 设置自动关闭
        if( o.autoClose ){
            timer = setTimeout(function(){
                easyDialog.close( o );
            }, o.autoClose );
        }        
    }
    
};
    
var Dialog = function( target, options ){
    target = $( target );
    options = options || {};
    
    if( !target.length ){
        return;
    }
    
    var o = $.extend( {}, defaults, options );
     
    win = o.topWindow ? window.top : window;
    doc = win.document;
    docElem = doc.documentElement;
    $win = $( win );
    $doc = $( doc );    
    $body = $( doc.body );
    
    // 设置将要添加到对话框中的自定义元素
    if( o.elem ){
        o.elem = $( o.elem ).eq( 0 );
        
        if( !o.elem.length ){
            o.elem = null;
        }
    }
    
    if( o.dragHandle ){
        o.dragHandle = $( o.dragHandle ).eq( 0 );
        
        if( !o.dragHandle.length ){
            o.dragHandle = null;
        }
    }    
    
    target.on( o.trigger + '.dialog', function(){
        easyDialog.init( o );
    });
    
    o.target = target;
    this.__o__ = o;
};    


Dialog.prototype = {

    destroy : function(){
        if( !this.__o__ ){
            return;
        }
        
        var o = this.__o__;
        
        if( dialogElem.is(':visible') ){
            this.close();
        }
        
        if( o.elem ){
            o.elem.hide();
            $body.append( o.elem );
        }        
        
        overlayElem.remove();
        dialogElem.remove();
        overlayElem = dialogElem = null;
        
        o.target.off( o.trigger + '.dialog likeopen likeclose' );
        delete this.__o__;
    },
    
    on : function( type, fn ){
        if( this.__o__ ){
            var self = this;
            self.__o__.target.on( 'like' + type, function( e ){
                e.type = type;
                e.target = dialogElem[0];
                fn.call( self, e );
                e.stopPropagation();
            });
        }

        return this;
    },
    
    un : function( type ){
        if( this.__o__ ){        
            this.__o__.target.off( 'like' + type );
        }
        
        return this;
    },
    
    close : function(){
        if( this.__o__ ){
            easyDialog.close( this.__o__ );
        }       
        
        return this;
    }
    
};

if( !$.ui ){
    $.ui = {};
}

$.ui.Dialog = Dialog;
    
});