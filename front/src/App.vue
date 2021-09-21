<template>
<div class="p-grid p-nogutter main">

  <div class="p-col-fixed header-left" @click="privateZone">
    <span>{{api.state.isLogged ? 'Личный кабинет' : 'Авторизоваться'}}</span>
    <i class="pi pi-bars"></i>
  </div>
  <div class="p-col p-d-flex p-ai-center header-logo">
    <router-link to="/">
      <img src="./assets/logo.png" />
    </router-link>
  </div>
  <div class="p-col-fixed p-d-flex p-flex-column p-ai-center header-right">
    <div class="phone">+7 499 348-94-42</div>
    <router-link to="/welcome">
      <RedButton>Вступить в клуб!</RedButton>
    </router-link>
    <div class="p-as-end info">
      <p>Успей попасть в клуб.</p>
      <p>Количество мест ограничено!</p>
    </div>
  </div>

  <div v-if="api.ssr && $route.meta.private" class="p-col-12 router-view">
    <Skeleton />
  </div>

  <div v-else class="p-col-12 router-view">
    <div v-if="$route.meta.private && !api.state.isLogged" class="p-d-flex p-jc-center">
      <Panel header="Авторизация" style="width: 30em">
        <Auth />
      </Panel>
    </div>

    <div v-else>
      <div v-if="$route.meta.private" class="p-mb-5">
        <h1>Личный кабинет</h1>
        <TabMenu :model="privateMenu" />
      </div>
      <router-view v-slot="{ Component }" :key="$route.fullPath">
        <Suspense timeout="0">
          <template #default>
            <component :is="Component" />
          </template>
          <template #fallback>
            <Skeleton />
          </template>
        </Suspense>
      </router-view>
    </div>
  </div>

  <div class="p-col-12 footer">
    <div class="p-grid p-nogutter">
      <div class="p-col-fixed left">
        <div class="social-icons p-flex-wrap">
          <a href="https://www.instagram.com/osherclub/" target="_blank">
            <img src="./assets/footer_icon_instagram.png">
          </a>
          <a href="#">
            <img src="./assets/footer_icon_vk.png">
          </a>
          <a href="#">
            <img src="./assets/footer_icon_whatsapp.png">
          </a>
          <a href="#">
            <img src="./assets/footer_icon_youtube.png">
          </a>
        </div>
        <div class="copyright">
          Все права на представленные материалы принадлежат их автору.
          Воспроизведение или распространение указанных материалов в любой форме может производиться только
          с письменного разрешения правообладателя.
          <br/>
        </div>
      </div>
      <div class="p-col"></div>
      <div class="p-col-fixed right">
        <h2>+7 499 348-94-42</h2>
        <h4>Ежедневно с 10 до 21</h4>
      </div>
    </div>
  </div>
</div>

<!--<Menu v-if="menu_open" :close="() => menu_open = false" />-->
<Dialog header="Авторизация" v-model:visible="loginDialog.state.isOpen" :breakpoints="{'960px': '75vw'}" :style="{width: '30vw'}" :modal="true" :draggable="true" :keepInViewPort="true" :minX="200" :minY="200">
  <Auth />
</Dialog>
<Connection/>

<Toast />

</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Menu from "./components/Menu.vue";
import RedButton from "./components/RedButton.vue";
import Skeleton from "./components/Skeleton.vue";
import Connection from "./components/Connection.vue";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Panel from "primevue/panel";
import TabMenu from "primevue/tabmenu";
import Auth from './components/Auth.vue';
import api from './modules/api';
import { useRouter } from "vue-router";
import Toast from 'primevue/toast';
import loginDialog from './modules/loginDialog';

export default defineComponent({
  setup() {
    //const menu_open = ref<boolean>(false);
    const router = useRouter();

    const privateMenu = [{
      label: 'Мои билеты', 
      icon: 'pi pi-fw pi-ticket', 
      to: '/tickets'
    }, {
      label: 'Профиль', 
      icon: 'pi pi-fw pi-user', 
      to: '/profile'
    }, {
      label: 'Выйти', 
      icon: 'pi pi-fw pi-power-off', 
      command: () => api.logout(),
    }];

    const privateZone = () => {
      router.push('/tickets');
    }

    return {
      //menu_open,
      privateMenu,
      privateZone,
      loginDialog,
      api,
    }
  },
  components: {
    Menu,
    RedButton,
    Skeleton,
    Connection,
    Button,
    Dialog,
    Auth,
    Panel,
    TabMenu,
    Toast,
  },
})
</script>

<style lang="scss">
* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, Verdana, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  margin: 0;
  padding: 0;
  width: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #F5F5F5;
}
</style>

<style lang="scss" scoped>
@import 'primeflex/src/_variables.scss';
.main {
  margin: 0 auto;
  max-width: 1600px;
  background-color: #FFF;
  box-shadow: rgba(0,0,0,0.1) 0px 0px 50px;
}
.header-left {
  font-size: 0.5rem;
  width: 14.25em;
  height: 16.25em;
  background-image: url("./assets/menu.png");
  background-size: contain;
  background-repeat: no-repeat;
  color: #EEE;
  cursor: pointer;

  span {
    font-size: 1.3em;
    display: block;
    position: relative;
    left: 0.5em;
    top: 0.5em;
  }

  i {
    display: block;
    position: relative;
    font-weight: bolder;
    font-size: 3em;
    left: 1.25em;
    top: 0.25em;
  }
  @media screen and (min-width: $md) {
    font-size: 0.8rem;
  }
  @media screen and (min-width: $lg) {
    font-size: 1rem;
  }
}
.header-logo {
  font-size: 0.5rem;
  img {
    width: 14.6em;
    margin: 0 2.5em;
  }
  @media screen and (min-width: $md) {
    font-size: 0.8rem;
  }
  @media screen and (min-width: $lg) {
    font-size: 1rem;
  }
}
.header-right {
  font-size: 0.5rem;
  width: 19.3em;
  .phone {
    font-size: 1.5em;
    font-weight: bold;
    margin: 1.2em 0;
  }
  .info {
    color: #ccc;
    margin: 1.5em;
    p {
      margin: 0;
      padding: 0;
    }
  }
  @media screen and (min-width: $md) {
    font-size: 0.8rem;
  }
  @media screen and (min-width: $lg) {
    font-size: 1rem;
  }
}
.router-view {
  min-height: 30rem;
  padding: 1em 2em 10em 2em;
  @media screen and (min-width: $lg) {
    padding: 1em 10em 10em 10em;
  }
}
.footer {
  min-height: 12.8em;
  background-image: url("./assets/bg_footer.jpg");
  background-repeat: repeat;
  padding: 0.5em 1.5em;
  .left {
    width: 30em;
    margin-top: 1em;
    .social-icons > a > img {
      width: 6.2em;
      padding: 0 2em 0 0;
    }
    .copyright {
      margin-top: 1em;
      color: #ff9999;
      font-size: 0.7rem;
      font-weight: bold;
    }
  }
  .right {
    width: 15.1em;
    h2 {
      color: #fff;
      text-align: right;
      padding: 0;
      margin-bottom: 0 1em;
    }
    h4 {
      color: #f99;
      text-align: right;
    }
  }
}
</style>
