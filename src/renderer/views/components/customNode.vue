<script setup lang="ts">
import { Position, Handle } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import StepNormal from '../../../assets/step-normal.png';
import { ref } from 'vue';

  
const props = defineProps<NodeProps<any>>()
  console.log('props customnode',props)
  const imgSrc = ref('')
  const initImgSrc = () => {
    if(props.data?.iconUrl) {
      imgSrc.value = `https://${props.data.iconUrl}`
    } else {
      imgSrc.value = StepNormal
    }
  }
  const handleError = () => {
    imgSrc.value = StepNormal
  }
  initImgSrc()
  
</script>

<template>
  <div class="custom-node-wrapper">
    <div class="custom-node">
      <Handle type="target" :position="Position.Left" style="opacity: 0;"/>
      <div class="step">
        <div class="icon">
          <img 
            :src="imgSrc" 
            alt="step-icon"
            @error="handleError"
            >
        </div>
        <div class="step-title">{{ data.label }}</div>
      </div>
      <Handle type="source" :position="Position.Right" style="opacity: 0;"/>
    </div>
  </div>
</template>
<style scoped lang="less">
.custom-node-wrapper {
  position: relative;
  border-radius: 50px;
  padding: 2px;
  background: linear-gradient(107deg,#62acec,#3489f6 42.73%,#7e27ff 99.87%);
  width: 100%;
  height: 100%;
}
.custom-node {
  background:  #141517;
  border-radius: 50px;
  padding: 10px 20px 10px 6px;
  text-align: center;
  color: white;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  &:hover {
    background: rgba(13, 32, 81, 0.30);
  }
}
.step {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .icon {
    width: 32px;
    height: 32px;
    margin-right: 4px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    img {
      width: 75%;
      height: 75%;
    }
  }
  .step-title {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
    line-height: 1.2;
    flex: 1;
    text-align: left;
  }
}

</style>