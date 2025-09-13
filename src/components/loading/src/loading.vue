<template>
  <transition name="ah-loading-fade" @after-leave="handleAfterLeave">
    <div v-show="visible" class="ah-loading-mask" :style="{ backgroundColor: background || '', zIndex }">
      <div v-if="type === 'default'" class="ah-loading-spinner"></div>
      <div v-else-if="type === 'circle'" class="ah-loading-circle"></div>
      <!-- <p v-if="text" class="ah-loading-text">{{ text }}</p> -->
    </div>
  </transition>
</template>

<script>
import { PopupManager } from '../../../utils/popup';
export default {
  name: 'AhLoading',
  data() {
    return {
      text: null,
      type: 'default',
      zIndex: 0,
      inputZIndex: 0,
      background: null,
      visible: false,
    };
  },
  watch: {
    visible(v) {
      if (v) {
        this.zIndex = this.inputZIndex || PopupManager.nextZIndex();
      }
    },
  },
  methods: {
    setText(text) {
      this.text = text;
    },
    handleAfterLeave() {
      this.$emit('after-leave');
    },
  },
};
</script>

<style lang="scss">
.ah-loading-parent--relative {
  position: relative !important;
}
</style>

<style lang="scss" scoped>
@use 'sass:math';
@import 'helpers';
$size: 52px;
$grbg1: rgba(71, 100, 234, 0.4);
$grbg2: rgba(29, 130, 227, 0.4);
$bg-loader: theme-v(dark, cBG);

.ah-loading {
  &-mask {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin: 0;
    position: absolute;
    background-color: $bg-loader;
    transition: opacity 0.3s;
  }
  &-spinner {
    position: absolute;
    width: $size;
    height: $size;
    top: 50%;
    left: 50%;
    margin-top: -(math.div($size, 2));
    margin-left: -(math.div($size, 2));
    perspective: 60vh;
    &:before,
    &:after {
      content: ' ';
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
    }
    &:before {
      left: -(math.div($size, 1.5));
      background-color: $grbg1;
      transform: translateZ(0);
      z-index: 1;
      animation: rotation1 1.5s ease-out infinite;
    }
    &:after {
      right: -(math.div($size, 1.5));
      background: $grbg2;
      transform: translateZ(0);
      z-index: 1;
      animation: rotation2 1.5s ease-out infinite;
    }
  }
  &-circle {
    position: absolute;
    width: 32px;
    height: 32px;
    top: 50%;
    left: 50%;
    margin-top: -16px;
    margin-left: -16px;
    border-radius: 50%;
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-top: 4px solid #485dea;
    animation: circle 1.4s linear infinite;
  }
}

.ah-loading-fade-leave-to {
  animation: fade-out 0.3s;
}

@keyframes rotation1 {
  25% {
    left: 0;
    transform: translateZ(-(math.div($size, 2)));
  }
  50% {
    left: math.div($size, 1.5);
    transform: translateZ(0);
  }
  75% {
    left: 0;
    transform: translateZ($size);
    z-index: 2;
  }
}
@keyframes rotation2 {
  25% {
    right: 0;
    transform: translateZ($size);
    z-index: 2;
  }
  50% {
    right: math.div($size, 1.5);
    transform: translateZ(0);
  }
  75% {
    right: 0;
    transform: translateZ(-(math.div($size, 2)));
  }
}
@keyframes circle {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes fade-out {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
