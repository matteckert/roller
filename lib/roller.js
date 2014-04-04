module.exports = exports = function() {
    if (typeof arguments[1] === 'number' || Array.isArray(arguments[1])) {
        return createLeafRoller(arguments[0], arguments[1]);
    }

    if (typeof arguments[0] === 'number' || Array.isArray(arguments[0])) {
        return createLeafRoller(1, arguments[0]);
    }

    var i;
    var rollers = [];
    for (i = 0; i < arguments.length; i++) {
        if (arguments[i].roll) {
            rollers.push(arguments[i]);
        }
    }

    if (rollers.length) {
        return spawn(compositeRoller, {
            transformers: [],
            rollers: rollers
        });
    }

    return createLeafRoller(1, 6);
};

function createLeafRoller(number, sides) {
    return spawn(leafRoller, {
        transformers: [],
        number: number,
        sides: sides
    })
}

var transformer = {
    transform: function(value) {
        value = this.transformers.filter(function(transformer) {
            return typeof transformer === 'function'
        }).reduce(function(previous, current) {
            return current(previous);
        }, value);

        return value;
    },

    addTransformer: function(transformer) {
        this.transformers.push(transformer);
    }
};

var universalTransformers = spawn(transformer, {
    sum: function(amountToAdd) {
        this.addTransformer(function(value) {
            if (Array.isArray(value)) {
                value = recursiveReduce(value, function(previous, current) {
                    return previous + current;
                }, 0);
            }
            return value + (amountToAdd || 0);
        });
        return this;
    },
    plus: function(amountToAdd) { this.sum(amountToAdd); },
    minus: function(amountToSubtract) { this.sum(-amountToSubtract); }
});

var compositeRoller = spawn(universalTransformers, {
    roll: function() {
        var value = this.transform(this.rollers.map(function(roller) {
            return roller.roll();
        }));
        return isSingleElementArray(value) ? value[0] : value;
    },

    explode: function(minimum) {
        this.rollers.forEach(function(roller) {
            roller.explode(minimum);
        });
    },

    toString: function() {
        return this.rollers.map(String).join(', ');
    }
});

var leafRoller = spawn(universalTransformers, {
    roll: function() {
        var i;
        var value = [];
        for (i = 0; i < this.number; i++) {
            if (Array.isArray(this.sides)) {
                value.push(this.sides[roll(this.sides.length)]);
            } else {
                value.push(roll(this.sides));
            }
        }
        value = this.transform(value);
        return isSingleElementArray(value) ? value[0] : value;
    },

    explode: function(minimum) {
        var sides = this.sides;
        minimum = minimum || sides;
        this.addTransformer(function(value) {
            value.forEach(function (value, i, array) {
                while (value >= minimum && array.length < 100) {
                    value = roll(sides);
                    array.push(value);
                }
            });
            return value;
        });
        return this;
    },

    high: function(n) {
        this.addTransformer(function(value) {
            return value.sort(descending).slice(0, n);
        });
        return this;
    },

    low: function(n) {
        this.addTransformer(function(value) {
            return value.sort(descending).slice(-n);
        });
        return this;
    },

    repeat: function(times) {
        if (times < 2) return this;
        var rollers = [];
        var i;
        for (i = 0; i < times; i++) {
            rollers.push(this);
        }

        var self = this;
        return spawn(compositeRoller, {
            transformers: [],
            rollers     : rollers,
            toString: function() {
                return String(self) + ' (x' + times + ')';
            }
        });
    },

    toString: function() {
        return this.number + 'roller' + this.sides;
    }
});

// Must call with initial value
function recursiveReduce(array, callback, initialValue) {
    return array.reduce(function(previous, current, i, array) {
        if (Array.isArray(current)) {
            return recursiveReduce(current, callback, previous);
        } else {
            return callback(previous, current, i, array);
        }
    }, initialValue);
}

function recursiveForEach(array, callback) {
    return array.forEach(function(value, i, array) {
        if (Array.isArray(value)) {
            recursiveForEach(value, callback);
        } else {
            callback(value, i, array);
        }
    });
}

function descending(a, b) {
    return b - a;
}

function isSingleElementArray(array) {
    return Array.isArray(array) && array.length === 1;
}

function roll(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

function spawn(object, properties) {
    return Object.create(object, makeDescriptors(properties || {}));
}

function makeDescriptors(properties) {
    var descriptors = {};
    var keys = Object.keys(properties);
    var i;
    for (i = 0; i < keys.length; i++) {
        descriptors[keys[i]] = defaultPropertyDescriptor(properties[keys[i]]);
    }
    return descriptors;
}

function defaultPropertyDescriptor(value) {
    return {
        value: value,
        configurable: true,
        enumerable: true,
        writeable: true
    }
}
