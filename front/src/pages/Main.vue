<template>
<div class="about">
  <p>
    <b>Женский Клуб O'Sher</b> - это место встречи девушек, женщин с едиными интересами
    (деловыми, познавательными, развивающими, развлекательными и прочими).
  </p>
  <p>
    <b>Женский клуб</b> - организует встречи регулярно, в зависимости от интересов членов клуба.
    Мы поделимся полезной информацией, которая поможет развить женственность, а это и есть наша основная цель.
  </p>

  <router-link to="/about">
    <RedButton>Подробнее о клубе</RedButton>
  </router-link>
</div>

<h1 class="p-my-6">Ближайшие мероприятия</h1>
<Suspense>
  <template #default>
    <Events :status="[Status.upcomming]" />
  </template>
  <template #fallback>
    <Skeleton />
  </template>
</Suspense>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Events from "../components/Events.vue";
import RedButton from "../components/RedButton.vue";
import { Status } from "../modules/product";
import Skeleton from "../components/Skeleton.vue";

export default defineComponent({
  async setup() {
    return {
      Status,
    }
  },
  components: {
    Events,
    RedButton,
    Skeleton,
  }
})
</script>

<style lang="scss" scoped>
.about {
  padding-top: 450px;
  font-size: 1.3rem;
  line-height: 2.3rem;
  background-image: url("../assets/bg_content_main.jpg");
  background-repeat: no-repeat;
  background-position: top center;
  margin-bottom: 10em;
}
</style>
