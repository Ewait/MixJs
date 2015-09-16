/**
 * Created by e_wait on 2015/9/16.
 */
var mix = function(){
    return new mix.prototype.init();
}
mix.prototype = {
    init: function(){
        return this;
    },
    name : function () {
        return this.age;
    },
    age: 1
}
mix.prototype.init.prototype = mix.prototype;
console.log(mix().init().name());
