var VueReactivity = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/reactivity/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    ReactiveEffect: () => ReactiveEffect,
    computed: () => computed,
    effect: () => effect,
    effectScope: () => effectScope,
    proxyRefs: () => proxyRefs,
    reactive: () => reactive,
    ref: () => ref,
    toRef: () => toRef,
    toRefs: () => toRefs,
    watch: () => watch
  });

  // packages/shared/src/index.ts
  var isObject = (value) => {
    return typeof value === "object" && value !== null;
  };
  var isArray = Array.isArray;
  var isFunction = (value) => typeof value === "function";

  // packages/reactivity/src/effectScope.ts
  var activeEffectScope = null;
  var EffectScope = class {
    constructor(detached) {
      this.detached = detached;
      this.active = true;
      this.parent = null;
      this.effects = [];
      this.scopes = [];
      if (!this.detached && activeEffectScope) {
        activeEffectScope.scopes.push(this);
      }
    }
    run(fn) {
      if (this.active) {
        try {
          this.parent = activeEffectScope;
          activeEffectScope = this;
          return fn();
        } finally {
          activeEffectScope = this.parent;
          this.parent = null;
        }
      }
    }
    stop() {
      if (this.active) {
        for (let i = 0; i < this.effects.length; i++) {
          this.effects[i].stop();
        }
        for (let i = 0; i < this.scopes.length; i++) {
          this.scopes[i].stop();
        }
        this.active = false;
      }
    }
  };
  function recordEffectScope(effect2) {
    if (activeEffectScope && activeEffectScope.active) {
      activeEffectScope.effects.push(effect2);
    }
  }
  function effectScope(detached = false) {
    return new EffectScope(detached);
  }

  // packages/reactivity/src/effect.ts
  var activeEffect = void 0;
  function cleanupEffect(effect2) {
    const { deps } = effect2;
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect2);
    }
    effect2.deps.length = 0;
  }
  var ReactiveEffect = class {
    constructor(fn, scheduler) {
      this.fn = fn;
      this.scheduler = scheduler;
      this.active = true;
      this.parent = null;
      this.deps = [];
      recordEffectScope(this);
    }
    run() {
      try {
        if (!this.active)
          return this.fn();
        this.parent = activeEffect;
        activeEffect = this;
        cleanupEffect(this);
        return this.fn();
      } finally {
        activeEffect = this.parent;
        this.parent = null;
      }
    }
    stop() {
      if (this.active) {
        this.active = false;
        cleanupEffect(this);
      }
    }
  };
  function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
  }
  var targetMap = /* @__PURE__ */ new WeakMap();
  function track(target, type, key) {
    if (!activeEffect)
      return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = /* @__PURE__ */ new Set());
    }
    trackEffects(dep);
  }
  function trackEffects(dep) {
    if (activeEffect) {
      const shouldTrack = !dep.has(activeEffect);
      if (shouldTrack) {
        dep.add(activeEffect);
        activeEffect.deps.push(dep);
      }
    }
  }
  function trigger(target, type, key, newValue, oldValue) {
    const depsMap = targetMap.get(target);
    if (!depsMap)
      return;
    let effects = depsMap.get(key);
    if (effects) {
      triggerEffects(effects);
    }
  }
  function triggerEffects(effects) {
    effects = new Set(effects);
    effects.forEach((effect2) => {
      if (effect2.active && activeEffect !== effect2) {
        if (effect2.scheduler) {
          effect2.scheduler();
        } else {
          effect2.run();
        }
      }
    });
  }

  // packages/reactivity/src/baseHandler.ts
  var baseHandler = {
    get(target, key, receiver) {
      if (key === "__v_isReactive" /* IS_REACTIVE */)
        return true;
      track(target, "get", key);
      const result = Reflect.get(target, key, receiver);
      if (isObject(result)) {
        return reactive(result);
      }
      return result;
    },
    set(target, key, newValue, receiver) {
      const oldValue = target[key];
      const result = Reflect.set(target, key, newValue, receiver);
      if (newValue !== oldValue) {
        trigger(target, "set", key, newValue, oldValue);
      }
      return result;
    }
  };

  // packages/reactivity/src/reactive.ts
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  function isReactive(value) {
    return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
  }
  function reactive(target) {
    if (!isObject(target))
      return;
    if (target["__v_isReactive" /* IS_REACTIVE */]) {
      return target;
    }
    const existProxy = reactiveMap.get(target);
    if (existProxy) {
      return existProxy;
    }
    const proxy = new Proxy(target, baseHandler);
    reactiveMap.set(target, proxy);
    return proxy;
  }

  // packages/reactivity/src/computed.ts
  var ComputedRefImpl = class {
    constructor(getter, setter) {
      this.getter = getter;
      this.setter = setter;
      this._dirty = true;
      this.__v_isReadonly = true;
      this.__v_isRef = true;
      this.dep = /* @__PURE__ */ new Set();
      this.effect = new ReactiveEffect(getter, () => {
        if (!this._dirty) {
          this._dirty = true;
          triggerEffects(this.dep);
        }
      });
    }
    get value() {
      trackEffects(this.dep);
      if (this._dirty) {
        this._value = this.effect.run();
        this._dirty = false;
      }
      return this._value;
    }
    set value(newVal) {
      this.setter(newVal);
    }
  };
  function computed(getterOrOptions) {
    let getter;
    let setter;
    let onlyGetter = isFunction(getterOrOptions);
    if (onlyGetter) {
      getter = getterOrOptions;
      setter = () => {
        console.warn("no set");
      };
    } else {
      getter = getterOrOptions.get;
      setter = getterOrOptions.set;
    }
    return new ComputedRefImpl(getter, setter);
  }

  // packages/reactivity/src/watch.ts
  function traversal(value, set = /* @__PURE__ */ new Set()) {
    if (!isObject(value))
      return value;
    if (set.has(value))
      return value;
    set.add(value);
    for (const key in value) {
      traversal(value[key], set);
    }
    return value;
  }
  function watch(source, cb) {
    let getter;
    if (isReactive(source)) {
      getter = () => traversal(source);
    } else if (isFunction(source)) {
      getter = source;
    }
    let cleanup;
    const onCleanup = (fn) => {
      cleanup = fn;
    };
    let oldValue;
    const job = () => {
      if (cleanup)
        cleanup();
      const newValue = effect2.run();
      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    };
    const effect2 = new ReactiveEffect(getter, job);
    oldValue = effect2.run();
  }

  // packages/reactivity/src/ref.ts
  function toReactive(value) {
    return isObject(value) ? reactive(value) : value;
  }
  var RefImpl = class {
    constructor(rawValue) {
      this.rawValue = rawValue;
      this.__v_isRef = true;
      this.dep = /* @__PURE__ */ new Set();
      this._value = toReactive(rawValue);
    }
    get value() {
      trackEffects(this.dep);
      return this._value;
    }
    set value(newValue) {
      if (newValue !== this.rawValue) {
        this._value = toReactive(newValue);
        this.rawValue = newValue;
        triggerEffects(this.dep);
      }
    }
  };
  var ObjectRefImpl = class {
    constructor(object, key) {
      this.object = object;
      this.key = key;
    }
    get value() {
      return this.object[this.key];
    }
    set value(newValue) {
      this.object[this.key] = newValue;
    }
  };
  function ref(value) {
    return new RefImpl(value);
  }
  function toRefs(object) {
    const result = isArray(object) ? new Array(object.length) : {};
    for (const key in object) {
      result[key] = toRef(object, key);
    }
    return result;
  }
  function toRef(object, key) {
    return new ObjectRefImpl(object, key);
  }
  function proxyRefs(object) {
    return new Proxy(object, {
      get(target, key, receiver) {
        let r = Reflect.get(target, key, receiver);
        if (r.__v_isRef) {
          return r.value;
        }
        return r;
      },
      set(target, key, newValue, receiver) {
        const oldValue = target[key];
        if (oldValue.__v_isRef) {
          oldValue.value = newValue;
          return true;
        }
        return Reflect.set(target, key, newValue, receiver);
      }
    });
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=reactivity.global.js.map
