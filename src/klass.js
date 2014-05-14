!function (name, context, definition) {
  if (typeof define == 'function') define(definition)
  else if (typeof module != 'undefined') module.exports = definition()
  else context[name] = definition()
}('klass', this, function (undefined) {
    var context = this, old = context.klass, f = 'function',
        fnTest = /xyz/.test(function () { xyz }) ? /\bsupr\b/ : /.*/,
        proto = 'prototype';

    function klass(o, isDecorator) {
        return extend.call(isFn(o) ? o : function() {
        }, o, 1, isDecorator);
    }

    function isFn(o) {
        return typeof o === f;
    }

    function wrap(k, fn, supr) {
        return function () {
            var tmp = this.supr;
            this.supr = supr[proto][k];
            var undef = {}.fabricatedUndefined;
            var ret = undef;
            try {
                ret = fn.apply(this, arguments);
            }
            finally {
                this.supr = tmp;
            }
            return ret;
        };
    }

    function process(what, o, supr) {
        for (var k in o) {
            if (o.hasOwnProperty(k)) {
                what[k] = isFn(o[k])
                    && isFn(supr[proto][k])
                    && fnTest.test(o[k])
                    ? wrap(k, o[k], supr) : o[k];
            }
        }
    }

    function copeFunctions(obj) {
        var funcs = {};
        for (var k in obj) {
            if (typeof obj[k] == "function")
                funcs[k] = obj[k];
        }
        return funcs;
        
    }
    function decorate(decoratedObj, decorator) {
        var tempFunc = function () { };
        tempFunc[proto]= copeFunctions(decoratedObj);
        var supr = tempFunc;
        for (var k in decorator) {
            if (k == "constructor") {
                continue;
            }
            decoratedObj[k] = isFn(decorator[k])
            && isFn(supr[proto][k])
            && fnTest.test(decorator[k])
            ? wrap(k, decorator[k], supr) : decorator[k];
        }
    }

    function extend(o, fromSub, isDecorator) {
        // must redefine noop each time so it doesn't inherit from previous arbitrary classes
        function noop() { }

        noop[proto] = this[proto];
        var supr = this
          , prototype = new noop()
          , isFunction = isFn(o)
          , _constructor = isFunction ? o : this
          , _methods = isFunction ? {} : o
          , callInit = true;
        function fn() {
            var self = this;
            if (!(this instanceof fn)) {
                callInit = false;
                self = new fn();
                callInit = true;
            }
            if (callInit) {
                if (self.initialize) {
                    self.initialize.apply(self, arguments);
                    isFn(self.afterInitialize) && self.afterInitialize.call(self);
                } else {
                    var originalCallCoutnValue;
                    self.callCount = self.callCount || 0;
                    ++self.callCount;
                    if (!fromSub && isFunction) {
                        supr.apply(self, arguments);
                    }
                    var callCountCopy = self.callCount;
                    _constructor.apply(self, arguments);
                    if (self.callCount !== callCountCopy) {
                        originalCallCoutnValue = self.callCount;
                    }
                    self.callCount = callCountCopy;
                    self.callCount--;
                    if (self.callCount === 0) {
                        if (originalCallCoutnValue === undefined) {
                            delete self.callCount;
                        } else {
                            self.callCount = originalCallCoutnValue;
                        }
                        !isDecorator && isFn(self.afterInitialize) && self.afterInitialize.call(self);
                    }
                }
            }

            return self;
        };

        fn.methods = function(o) {
            process(prototype, o, supr);
            fn[proto] = prototype;
            return this;
        };

        fn.methods.call(fn, _methods).prototype.constructor = fn;

        fn.extend = arguments.callee;
        fn[proto].implement = fn.statics = function(o, optFn) {
            o = typeof o == 'string' ? (function() {
                var obj = { };
                obj[o] = optFn;
                return obj;
            }()) : o;
            process(this, o, supr);
            return this;
        };
        return fn;
    };

    klass.decorator = function (o) {
        var decoratorFn = klass(o, true);
        decoratorFn[proto].decorate = function (decoratedObj) {
            var decoratorObj = this;
            decorate(decoratedObj, decoratorObj);
            isFn(decoratorObj.afterInitialize) && decoratedObj.afterInitialize.call(decoratedObj);
            return decoratedObj;
        };
        decoratorFn.extend = decoratorFn[proto].implement = decoratorFn.statics = function () {
            throw "Decorators can not inherit or override functions.";
        };
        
        return decoratorFn;
    };

    klass.noConflict = function() {
        context.klass = old;
        return this;
    };

    return klass;
});