<script setup lang="ts">
import { computed } from 'vue';
import type { TabItem } from '../container.vue';

interface Props {
  tabs: TabItem[];
  activeTab: number;
}

const props = defineProps<Props>();
const emit = defineEmits(['tab-click']);

function handleClick(tab: TabItem, index: number) {
  emit('tab-click', tab, index);
}

// function handleChildClick(tab: TabItem, index: number) {
//   emit('tab-click', tab, index);
// }
const formatTabs = computed(() => {
  const targetRes: TabItem[][] = [];
  const result: TabItem[] = [];
  
  
  function flatten(items: TabItem[] | undefined, level: number) {
    if (!items || items.length === 0) {
      return;
    }
    
    // 将当前层级的节点数组添加到结果中
    targetRes[level] = [...items];
    
    // todo：递归处理对应节点的子节点，同样需要查询到对应子分类id，才能激活对应子分类
    if (items[0] && items[0].child && items[0].child.length > 0) {
      flatten(items[0].child, level + 1);
    }
  }
  
  flatten(props.tabs, 0);//todo: 传入对应的tab索引
  console.log('result==',result,targetRes)
  return targetRes;
});

</script>
<template>
<div class="tab-tree">
    <div 
      v-for="(item, index) in formatTabs" 
      :key="index"
      class="tab-item"
    >
      <div class="col-sub-tab"
        :class="{ active: false }"
        v-for="(childItem, childIndex) in item" 
        @click="handleClick(childItem, childIndex)"
        >
        {{ childItem.name }}
      </div>
      <!-- <tab-tree 
        v-if="item.child && item.child.length" 
        :tabs="item.child" 
        :active-tab="activeTab"
        @tab-click="handleChildClick"
      /> -->
    </div>
  </div>
</template>
<style lang="less" scoped>
.tab-tree {
  // display: flex;
  // justify-content: center;
  border-top: 1px solid #2b2b2b;
  padding: 4px 0 3px 0;
  font-size: 14px;
  border-top: 1px solid #2b2b2b;
  background-color: #17181a;
}
.tab-item {
  padding: 5px 10px;
  cursor: pointer;
  display: flex;
  justify-content: center;
}
.tab-item.active {
  color: var(--primary-color-hover);
  font-weight: bold;
}
.col-sub-tab {
  display: flex;
  justify-content: center;
  padding: 5px 10px;
  cursor: pointer;
}
</style>