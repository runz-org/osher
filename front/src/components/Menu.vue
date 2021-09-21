<template>
  <div class="main_menu">
    <div class="menu_fade">
      <img src="../assets/menu_fade.png" @click="close" />
    </div>
    <div class="p-grid">
      <div class="p-col-4">
        <div @click="menuClick('/events/')">
          <img class="icon" src="../assets/menu_pic_events.jpg" @click="close" />
          <h2>Ближайшие мероприятия</h2>
        </div>
      </div>
      <div class="p-col-4"></div>
      <div class="p-col-4"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { useRouter } from "vue-router";

export default defineComponent({
  name: 'Menu',
  props: {
    close: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup({ close }) {
    const router = useRouter();

    const menuClick = async (to: string) => {
      router.push(to);
      close();
    }

    return {
      menuClick,
    }
  },
})
</script>

<style lang="scss" scoped>
.menu_fade {
  position: fixed;
  left: 60px;
  top: 20px;
  font-size: 64px;
  cursor: pointer;
  z-index: 999;

  img {
    width: 50px;
  }
}
.main_menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255,255,255,0.9);
  text-align: center;

  padding-top: 100px;

  .icon {
    width: 300px;
  }
}
</style>
