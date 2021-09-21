<template>
<div class="p-fluid">

  <div v-if="block.phone" class="p-field">
    <label for="auth-phone">Телефон</label>
    <div class="p-inputgroup">
      <span class="p-inputgroup-addon">+7</span>
      <InputMask :disabled="state.sendingCode" v-model="state.phone" id="auth-phone" mask="(999) 999-9999" placeholder="(999) 999-9999" />
    </div>
  </div>

  <div v-if="block.phone" class="p-field">
    <Button :disabled="state.sendingCode" class="p-button-raised" @click="() => sendCode()">
      <span class="p-text-center p-d-block" style="width:100%">
        Получить код для входа
      </span>
      <span v-if="state.sendingCode" class="p-text-center p-d-block" style="width:100%;position:absolute;">
        <ProgressSpinner style="width:2em;height:2em;" strokeWidth="5" animationDuration="5s" />
      </span>
    </Button>
  </div>

  <div v-if="block.phone" class="p-field description">
    На указанный номер будет выслано sms-сообщение с кодом.
  </div>

  <div v-if="block.code" class="p-field">
    <label for="auth-code">Код</label>
    <InputMask v-model="state.code" id="auth-code" mask="999999" />

    <div v-if="retry.try_count === 0" class="p-mt-3">
      <Button :disabled="state.checkingCode" class="p-button-raised" @click="login">
        <span class="p-text-center p-d-block" style="width:100%">
          Вход
        </span>
        <span v-if="state.checkingCode" class="p-text-center p-d-block" style="width:100%;position:absolute;">
          <ProgressSpinner style="width:2em;height:2em;" strokeWidth="5" animationDuration="5s"/>
        </span>
      </Button>
    </div>

    <div v-if="retry.try_count > 0" class="p-mt-1">
      <span class="p-d-block p-mb-1 p-text-nowrap description" style="color:#C63737">
        <span v-if="retry.try_count === 1">
          Нет, не тот.
        </span>
        <span v-else>
          Опять не тот.
        </span>
        <span v-if="retry.total_try_count - retry.try_count > 1">
          Осталось {{retry.total_try_count - retry.try_count}} попытки,
        </span>
        <span v-else>
          Осталась ещё попытка,
        </span>
        <br />
        иначе нужно получить его повторно.
      </span>
      <Button :disabled="state.checkingCode" class="p-button-raised" @click="login">
        <span class="p-text-center p-d-block" style="width:100%">
          Попробовать ещё раз
        </span>
        <span v-if="state.checkingCode" class="p-text-center p-d-block" style="width:100%;position:absolute;">
          <ProgressSpinner style="width:2em;height:2em;" strokeWidth="5" animationDuration="5s" />
        </span>
      </Button>
    </div>
  </div>

  <div v-if="block.code" class="p-field description">
    <span class="p-d-inline p-mr-2">Код выслан на номер</span>
    <b class="p-d-inline p-text-nowrap">+7 {{state.phone}}</b>
    <a href="#" class="p-d-block p-my-2 p-text-nowrap" @click="otherPhoneClick">
      Другой номер?
    </a>
    <a v-if="!block.resend" href="#" class="p-d-block p-my-2 p-text-nowrap" @click="noCodeClick">
      Не получили код?
    </a>
  </div>

  <div v-if="block.captcha || (!block.code && block.resend)" class="p-field description">
    <span class="p-d-inline p-mr-2">Код будет выслан на номер</span>
    <b class="p-d-inline p-text-nowrap">+7 {{state.phone}}</b>
    <a href="#" class="p-d-block p-my-2 p-text-nowrap" @click="otherPhoneClick">
      Другой номер?
    </a>
  </div>

  <div v-if="block.captcha" class="p-field">
    <div id="recaptcha"></div>
  </div>

  <div v-if="block.resend" class="p-field">
    <span v-if="retry.cooldown_ts > 0">
      Код можно получить повторно<br />через {{ retry.cooldown_ts }} {{ format.pieces(retry.cooldown_ts, 'секунду', 'секунды', 'секунд') }}
    </span>
    <Button v-else label="Получить код повторно" class="p-button-raised" @click="() => sendCode()" />
  </div>

</div>
</template>

<script lang="ts">
import { reactive, defineComponent } from 'vue'
import InputMask from 'primevue/inputmask';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import ProgressSpinner from "primevue/progressspinner";
import format from '../modules/format';
import api, { Retry } from '../modules/api';

export default defineComponent({
  setup() {
    const block = reactive({
      phone: true,
      captcha: false,
      code: false,
      resend: false,
    });

    const retry = reactive({
      cooldown_ts: 0,
      try_count: 0,
      total_try_count: 0,
    })

    const state = reactive({
      phone: '',
      code: '',
      sendingCode: false,
      checkingCode: false,
    })

    let recaptcha_id: number | null = null;

    const getPhone = (): string | null => {
      const phoneParts = state.phone.match(/\d+/g);
      return null === phoneParts ? null : '7' + phoneParts.join('');
    }

    const getCode = (): string | null => {
      const codeParts = state.code.match(/\d+/g);
      return null === codeParts ? null : codeParts.join('');
    }

    const getRecaptchaApi = async (): Promise<any> => {
      return new Promise((resolve, reject) => {
        const w = window as any;
        if (w.grecaptcha) return resolve(w.grecaptcha);
        w.recaptchaReady = () => w.grecaptcha ? resolve(w.grecaptcha) : reject('Could not find grecaptcha object');
        const script = window.document.createElement('script');
        script.id = 'recaptcha-script';
        script.setAttribute('src', 'https://www.google.com/recaptcha/api.js?onload=recaptchaReady&render=explicit');
        window.document.head.appendChild(script);
      });
    }

    const setRetry = async ({
      cooldown_mts,
      total_cooldown_mts,
      try_count,
      total_try_count,
    }: Retry): Promise<void> => {
      const counting = retry.cooldown_ts > 0;
      retry.cooldown_ts = Math.ceil(cooldown_mts / 1000);
      retry.try_count = try_count;
      retry.total_try_count = total_try_count;

      if (!counting) {
        const interval = setInterval(() => {
          if (retry.cooldown_ts > 0) {
            retry.cooldown_ts--;
          }

          if (retry.cooldown_ts <= 0) {
            clearInterval(interval)
            retry.cooldown_ts = 0;
          }             
        }, 1000);
      }

      block.phone = false;
      block.captcha = 0 === total_try_count;
      block.code = total_try_count > try_count;
      block.resend = total_cooldown_mts > cooldown_mts;

      if (block.captcha) {
        const recaptchaApi = await getRecaptchaApi();

        if (null === recaptcha_id) {
          recaptcha_id = recaptchaApi.render('recaptcha', {
            sitekey: (import.meta as any).env.VITE_RECAPTCHA_KEY,
            callback: (response: string) => sendCode(response),
          });
        } else {
          recaptchaApi.reset(recaptcha_id);
        }
      } else {
        recaptcha_id = null;
      }
    }

    const sendCode = async (captcha: string | null = null) => {
      const phone = getPhone();

      if (null === phone) {
        return;
      }

      state.sendingCode = true;
      const retry = await api.authSendCode(phone, captcha);
      state.code = '';
      await setRetry(retry);
      state.sendingCode = false;
    };

    const login = async () => {
      const phone = getPhone();
      const code = getCode();

      if (null === phone || null === code) {
        return;
      }

      state.checkingCode = true;
      const retry = await api.login(phone, code);
      if (retry) await setRetry(retry);
      state.checkingCode = false;
    }

    const otherPhoneClick = async () => {
      block.phone = true;
      block.captcha = false;
      block.code = false;
      block.resend = false;
      state.phone = '';
      recaptcha_id = null;
    }

    const noCodeClick = async () => {
      block.resend = true;
    }

    return {
      state,
      block,
      retry,
      sendCode,
      login,
      otherPhoneClick,
      noCodeClick,
      format,
    };
  },
  components: {
    InputMask,
    InputNumber,
    Button,
    ProgressSpinner,
  },
})
</script>

<style lang="scss" scoped>
.description {
  color: #888;
}
::v-deep(.p-progress-spinner-circle) {
  stroke: #fff;
  animation: p-progress-spinner-dash 1.5s ease-in-out infinite;
}
</style>
