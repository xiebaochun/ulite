/*
* Slider component for jQuery ( AMD Module )
*
* Copyright (c) 2013 Yiguo Chan
* Released under the MIT Licenses
*
* Docs : https://github.com/chenmnkken/ecope/wiki/Slider-%E6%BB%91%E5%8A%A8%E6%9D%A1
* Mail : chenmnkken@gmail.com
* Date : 2013-10-27
*/
define(['../../drag/js/drag'], function(){

'use strict';

var defaults = {       
    axis       :   'x',       // String        滑动方向
    min        :   0,         // Number        最小值
    max        :   100,       // Number        最大值    
    value      :   0,         // Number        默认值
    size       :   '220px'    // String        尺寸 
};

var easySlider = {
        
    setValue : function( o, value, isComputed ){
        var complete = o.complete,            
            min = o.min,
            max = o.max;            
        
        if( isComputed ){
            value += 'px';                
        }
        else{
            value = value < min ? min :
                value > max ? max : value;
                
            value = ( value - o.min ) * o.length / o.ratio + 'px'; 
        }
        
        if( complete ){
            complete[0].style[ o.sizeName ] = value;
        }
        
        o.thumb[0].style[ o.posName ] = value;
    }
        
};

var Slider = function( target, options ){
    target = $( target ).eq( 0 );
    options = options || {};
    
    if( !target.length ){
        return;
    }
    
    var o = $.extend( {}, defaults, options ),

        complete = target.find( 'div.sd_complete' ),
        thumb = target.find( 'div.sd_thumb' ),  
        
        axis = o.axis,
        min = o.min,
        max = o.max,
        ES = easySlider,
        isX = axis === 'x',
        posName = isX ? 'left' : 'top',
        sizeName = isX ? 'width' : 'height',    
        ratio = max - min,
        slider = this,
        size = o.size,
        drag, completeStyle, length;
        
    target.css( sizeName, size );    
    length = target[ sizeName ]() - thumb[ sizeName ]();    
        
    o.thumb = thumb;    
    o.length = length;
    o.ratio = ratio;
    o.posName = posName;
    o.sizeName = sizeName;
        
    if( complete.length ){
        o.complete = complete;
        completeStyle = complete[0].style;        
    }    
        
    ES.setValue( o, o.value );
    slider.value = o.value;
        
    drag = new $.ui.Drag( thumb, {
        axis : axis,
        container : target,
        moveHand : false 
    });
    
    drag.on( 'dragstart', function(){
            thumb.trigger( 'likeslidestart' );
        })    
        .on( 'drag', function(){
            var value = this[ posName ];
            if( completeStyle ){
                completeStyle[ sizeName ] = value + 'px';
            }            
           
            slider.value = Math.round( value / length * ratio ) + min;                
            thumb.trigger( 'likeslide' );
        })
        .on( 'dragend', function(){
            thumb.trigger( 'likeslideend' );
        });

    target.on( 'click.slider', function( e ){
        var offsetName = 'offset' + axis.toUpperCase(),
            offset = e[ offsetName ];
            
        offset = offset > length ? length : offset;                      
        ES.setValue( o, offset, true ); 
        slider.value = Math.round( offset / length * ratio ) + min;
        thumb.trigger( 'likeslide' );
        
        // 让thumb获取到焦点
        thumb[0].focus();
    });
    
    // 添加tabindex以响应键盘事件
    if( !thumb.attr('tabindex') ){
        thumb.attr( 'tabindex', '0' );
    }
    
    thumb.on( 'click.slider', function( e ){
            // 让thumb获取到焦点
            this.focus();
            e.stopPropagation();
        })
        // 绑定键盘事件
        .on( 'keydown.slider', function( e ){
            var which = e.which,
                isX = axis === 'x',
                isTrigger = false,
                value = slider.value;
        
            if( isX && which === 39 || !isX && which === 40 ){
                isTrigger = true;
                value++;
            }
            else if( isX && which === 37 || !isX && which === 38 ){
                isTrigger = true;
                value--;
            }
                
            if( value < min || value > max ){
                isTrigger = false;
            }
            
            if( isTrigger ){
                ES.setValue( o, value );
                slider.value = value;
                thumb.trigger( 'likeslide' );
            }
            
            return false;
        });
    
    o.target = target;
    o.drag = drag;
    slider.__o__ = o;
};

Slider.prototype = {

    destroy : function(){
        if( !this.__o__ ){
            return;
        }    
 
        var o = this.__o__;
        
        o.drag.destroy();
        o.thumb.off( 'likeslidestart likeslide likeslideend click.slider keydown.slider' );
        o.target.off( 'click.slider' );
        
        this.__o__ = o = null;
        delete this.__o__;
    },
    
    on : function( type, fn ){
        if( !this.__o__ ){
            return this;
        }
        
        var self = this,
            o = self.__o__;
        
        o.thumb.on( 'like' + type, function( e ){
            e.type = type;
            fn.call( self, e );
            e.stopPropagation();
        });
        
        return this;
    },
    
    un : function( type ){
        if( this.__o__ ){
            this.__o__.thumb.off( 'like' + type );
        }
        
        return this;
    },
    
    setValue : function( value ){
        if( !this.__o__ ){
            return this;
        }
        
        var o = this.__o__;
    
        easySlider.setValue( o, value );    
        this.value = value;
        o.thumb.trigger( 'likeslide' );
        return this;
    }
    
};

if( !$.ui ){
    $.ui = {};
}

$.ui.Slider = Slider;

});