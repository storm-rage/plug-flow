import Vue from 'vue';
import AhLoading from './loading.vue';

const Mask = Vue.extend(AhLoading);

function getStyle(element, styleName) {
  try {
    const computed = document.defaultView.getComputedStyle(element, '');
    return element.style[styleName] || computed ? computed[styleName] : null;
  } catch (e) {
    return element.style[styleName];
  }
}
/* eslint no-param-reassign: ["error", { "props": false }] */
const loadingDirective = {};
loadingDirective.install = (vue) => {
  if (vue.prototype.$isServer) return;
  const insertDom = (parent, el) => {
    if (!el.domVisible && getStyle(el, 'display') !== 'none' && getStyle(el, 'visibility') !== 'hidden') {
      if (el.originalPosition !== 'absolute' && el.originalPosition !== 'fixed') {
        parent.classList.add('ah-loading-parent--relative');
      }
      el.domVisible = true;
      parent.appendChild(el.mask);
      Vue.nextTick(() => {
        if (el.instance.hiding) {
          el.instance.$emit('after-leave');
        } else {
          el.instance.visible = true;
        }
      });
      el.domInserted = true;
    } else if (el.domVisible && el.instance.hiding === true) {
      el.instance.visible = true;
      el.instance.hiding = false;
    }
  };
  const toggleLoading = (el, binding) => {
    if (binding.value) {
      Vue.nextTick(() => {
        el.originalPosition = getStyle(el, 'position');
        insertDom(el, el);
      });
    } else {
      el.instance.$on('after-leave', () => {
        el.domVisible = false;
        el.classList.remove('el-loading-parent--relative');
        el.instance.hiding = false;
      });
      el.instance.visible = false;
      el.instance.hiding = true;
    }
  };

  Vue.directive('loading', {
    bind(el, binding, vnode) {
      const textExr = el.getAttribute('ah-loading-text');
      const loadingType = el.getAttribute('ah-loading-type');
      const zIndex = el.getAttribute('ah-loading-zindex');
      const backgroundExr = el.getAttribute('ah-loading-background');
      const vm = vnode.context;
      const mask = new Mask({
        el: document.createElement('div'),
        data: {
          text: (vm && vm[textExr]) || textExr,
          type: loadingType || 'default',
          inputZIndex: zIndex || 2000,
          background: (vm && vm[backgroundExr]) || backgroundExr,
        },
      });
      el.instance = mask;
      el.mask = mask.$el;
      el.maskStyle = {};

      if (binding.value) {
        toggleLoading(el, binding);
      }
    },

    update(el, binding) {
      el.instance.setText(el.getAttribute('ah-loading-text'));
      if (binding.oldValue !== binding.value) {
        toggleLoading(el, binding);
      }
    },

    unbind(el, binding) {
      if (el.domInserted) {
        if (el.mask && el.mask.parentNode) {
          el.mask.parentNode.removeChild(el.mask);
        }
        toggleLoading(el, { value: false, modifiers: binding.modifiers });
      }
    },
  });
};

export default loadingDirective;
