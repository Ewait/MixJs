/**
 * Created by e_wait on 2015/9/16.
 */
var mix = function(){
    var age;
    return new mix.prototype.init();
}
mix.prototype = {
    init: function(){
        return this;
    },
    setAge: function(value){
        this.age = value;
        return this;
    },
    getAge : function () {
        return this.age;
    }
}
mix.prototype.init.prototype = mix.prototype;
console.log(mix().setAge(20).getAge());