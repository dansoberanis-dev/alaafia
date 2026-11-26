/* ============================================================
   CASA CULTURAL ÀLÀÁFÍÀ · interações do site
   ============================================================ */
(function () {
  'use strict';

  var reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Tela de carregamento ---------- */
  var loader = document.getElementById('loader');
  function esconderLoader() {
    if (!loader) return;
    document.body.classList.add('carregado'); // dispara as animações do hero
    loader.classList.add('pronto');
    setTimeout(function () { loader.remove(); }, 800);
  }
  if (document.readyState === 'complete') {
    setTimeout(esconderLoader, 500);
  } else {
    window.addEventListener('load', function () { setTimeout(esconderLoader, 500); });
    setTimeout(esconderLoader, 3500); // garantia, caso algo trave o carregamento
  }

  /* ---------- Cabeçalho, progresso e ano ---------- */
  var cabecalho = document.getElementById('cabecalho');
  var progresso = document.getElementById('progressoScroll');
  function aoRolar() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (cabecalho) cabecalho.classList.toggle('rolado', y > 24);
    if (progresso) {
      var altura = document.documentElement.scrollHeight - window.innerHeight;
      progresso.style.width = (altura > 0 ? (y / altura) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  var ano = document.getElementById('anoAtual');
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---------- Menu móvel ---------- */
  var btnMenu = document.getElementById('btnMenu');
  var menuMobile = document.getElementById('menuMobile');
  if (btnMenu && menuMobile) {
    function alternarMenu(forcar) {
      var aberto = typeof forcar === 'boolean' ? forcar : !menuMobile.classList.contains('aberto');
      menuMobile.classList.toggle('aberto', aberto);
      btnMenu.classList.toggle('aberto', aberto);
      btnMenu.setAttribute('aria-expanded', String(aberto));
      btnMenu.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
      document.body.style.overflow = aberto ? 'hidden' : '';
    }
    btnMenu.addEventListener('click', function () { alternarMenu(); });
    menuMobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { alternarMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') alternarMenu(false);
    });
  }

  /* ---------- Navegação ativa por seção ---------- */
  var linksNav = document.querySelectorAll('.nav-link[data-nav]');
  if (linksNav.length && 'IntersectionObserver' in window) {
    var mapa = {};
    linksNav.forEach(function (l) { mapa[l.getAttribute('data-nav')] = l; });
    var observadorNav = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting && mapa[en.target.id]) {
          linksNav.forEach(function (l) { l.classList.remove('ativo'); });
          mapa[en.target.id].classList.add('ativo');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('section[id]').forEach(function (s) { observadorNav.observe(s); });
  }

  /* ---------- Revelação de entrada ---------- */
  var revelaveis = document.querySelectorAll('[data-reveal]');
  if (revelaveis.length) {
    if (reduzMovimento || !('IntersectionObserver' in window)) {
      revelaveis.forEach(function (el) { el.classList.add('visivel'); });
    } else {
      var observadorReveal = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('visivel');
            observadorReveal.unobserve(en.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      revelaveis.forEach(function (el) { observadorReveal.observe(el); });
    }
  }

  /* ============================================================
     PROGRAMAÇÃO CULTURAL · carrossel rotativo
     1 card visível no mobile, 3 no desktop. Avança a cada 3s.
     ============================================================ */
  var palco = document.getElementById('palco');
  var trilha = document.getElementById('trilha');
  if (palco && trilha) {
    var slots = Array.prototype.slice.call(trilha.children);
    var total = slots.length;
    var btnPrev = document.getElementById('btnPrev');
    var btnNext = document.getElementById('btnNext');
    var dotsBox = document.getElementById('dots');
    var contador = document.getElementById('contador');
    var barraTempo = document.getElementById('barraTempo');
    var indice = 0;
    var temporizador = null;
    var pausado = false;
    var DURACAO = 3000;

    function visiveis() { return window.innerWidth >= 900 ? 3 : 1; }
    function maximo() { return Math.max(0, total - visiveis()); }

    // pontos de navegação (um por card)
    var dots = [];
    for (var i = 0; i < total; i++) {
      var d = document.createElement('button');
      d.className = 'dot';
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', 'Ir para o evento ' + (i + 1));
      (function (n) {
        d.addEventListener('click', function () { irPara(n); reiniciar(); });
      })(i);
      dotsBox.appendChild(d);
      dots.push(d);
    }

    function mostrar() {
      indice = Math.max(0, Math.min(indice, maximo()));
      var larguraSlot = 100 / visiveis();
      trilha.style.transform = 'translateX(-' + (indice * larguraSlot) + '%)';
      slots.forEach(function (s, n) {
        var ativo = n >= indice && n < indice + visiveis();
        s.classList.toggle('ativo', ativo);
        s.setAttribute('aria-hidden', ativo ? 'false' : 'true');
      });
      dots.forEach(function (d, n) { d.classList.toggle('ativo', n === indice); });
      if (contador) contador.textContent = (indice + 1) + ' / ' + total;
    }

    function avancar() { indice = indice >= maximo() ? 0 : indice + 1; mostrar(); }
    function voltar() { indice = indice <= 0 ? maximo() : indice - 1; mostrar(); }
    function irPara(n) { indice = n; mostrar(); }

    function reiniciarBarra() {
      if (!barraTempo) return;
      barraTempo.classList.remove('rodando');
      void barraTempo.offsetWidth; // força reflow para reiniciar a animação
      if (!pausado && !reduzMovimento) barraTempo.classList.add('rodando');
    }

    function iniciar() {
      parar();
      if (reduzMovimento) return;
      temporizador = setInterval(avancar, DURACAO);
      reiniciarBarra();
    }
    function parar() { if (temporizador) { clearInterval(temporizador); temporizador = null; } }
    function reiniciar() { iniciar(); }

    if (btnNext) btnNext.addEventListener('click', function () { avancar(); reiniciar(); });
    if (btnPrev) btnPrev.addEventListener('click', function () { voltar(); reiniciar(); });

    // pausa ao passar o mouse ou navegar por teclado
    palco.addEventListener('mouseenter', function () { pausado = true; parar(); reiniciarBarra(); });
    palco.addEventListener('mouseleave', function () { pausado = false; iniciar(); });
    palco.addEventListener('focusin', function () { pausado = true; parar(); reiniciarBarra(); });
    palco.addEventListener('focusout', function () { pausado = false; iniciar(); });

    // arrastar com o dedo (mobile) e com o mouse
    var inicioX = null;
    palco.addEventListener('touchstart', function (e) { inicioX = e.touches[0].clientX; }, { passive: true });
    palco.addEventListener('touchend', function (e) {
      if (inicioX === null) return;
      var dx = e.changedTouches[0].clientX - inicioX;
      if (Math.abs(dx) > 42) { if (dx < 0) avancar(); else voltar(); reiniciar(); }
      inicioX = null;
    }, { passive: true });
    palco.addEventListener('mousedown', function (e) { inicioX = e.clientX; });
    palco.addEventListener('mouseup', function (e) {
      if (inicioX === null) return;
      var dx = e.clientX - inicioX;
      if (Math.abs(dx) > 60) { if (dx < 0) avancar(); else voltar(); reiniciar(); }
      inicioX = null;
    });

    // setas do teclado quando o carrossel está em foco
    palco.setAttribute('tabindex', '0');
    palco.setAttribute('aria-roledescription', 'carrossel');
    palco.setAttribute('aria-label', 'Programação cultural. Use as setas para navegar entre os eventos.');
    palco.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { avancar(); reiniciar(); }
      if (e.key === 'ArrowLeft') { voltar(); reiniciar(); }
    });

    window.addEventListener('resize', mostrar);
    mostrar();
    iniciar();
  }

  /* ============================================================
     GALERIA · filtros e lightbox
     ============================================================ */
  var grade = document.getElementById('galeriaGrade');
  var botoesFiltro = document.querySelectorAll('.filtro[data-filtro]');
  var itens = grade ? Array.prototype.slice.call(grade.querySelectorAll('.item-galeria')) : [];

  botoesFiltro.forEach(function (btn) {
    btn.addEventListener('click', function () {
      botoesFiltro.forEach(function (b) { b.classList.remove('ativo'); });
      btn.classList.add('ativo');
      var filtro = btn.getAttribute('data-filtro');
      itens.forEach(function (item) {
        var mostrarItem = filtro === 'todas' || item.getAttribute('data-grupo') === filtro;
        item.style.display = mostrarItem ? '' : 'none';
        if (mostrarItem) {
          item.classList.remove('visivel');
          requestAnimationFrame(function () { requestAnimationFrame(function () { item.classList.add('visivel'); }); });
        }
      });
    });
  });

  var lightbox = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbLegenda = document.getElementById('lbLegenda');
  var lbFechar = document.getElementById('lbFechar');
  var lbPrev = document.getElementById('lbPrev');
  var lbNext = document.getElementById('lbNext');
  var indiceFoto = 0;

  function fotosVisiveis() {
    return itens.filter(function (it) { return it.style.display !== 'none'; });
  }
  function abrirFoto(item) {
    var visiveis = fotosVisiveis();
    indiceFoto = visiveis.indexOf(item);
    atualizarFoto(visiveis);
    lightbox.classList.add('aberto');
    document.body.style.overflow = 'hidden';
    lbFechar.focus();
  }
  function atualizarFoto(visiveis) {
    visiveis = visiveis || fotosVisiveis();
    var item = visiveis[indiceFoto];
    if (!item) return;
    var img = item.querySelector('img');
    lbImg.src = img.getAttribute('src');
    lbImg.alt = img.getAttribute('alt') || '';
    lbLegenda.textContent = item.getAttribute('data-legenda') || img.getAttribute('alt') || '';
  }
  function fecharFoto() {
    lightbox.classList.remove('aberto');
    document.body.style.overflow = '';
  }
  function navegarFoto(dir) {
    var visiveis = fotosVisiveis();
    indiceFoto = (indiceFoto + dir + visiveis.length) % visiveis.length;
    atualizarFoto(visiveis);
  }

  itens.forEach(function (item) {
    item.addEventListener('click', function () { abrirFoto(item); });
  });
  if (lightbox) {
    lbFechar.addEventListener('click', fecharFoto);
    lbPrev.addEventListener('click', function () { navegarFoto(-1); });
    lbNext.addEventListener('click', function () { navegarFoto(1); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) fecharFoto(); });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('aberto')) return;
      if (e.key === 'Escape') fecharFoto();
      if (e.key === 'ArrowRight') navegarFoto(1);
      if (e.key === 'ArrowLeft') navegarFoto(-1);
    });
  }

  /* ============================================================
     FORMULÁRIO · validação e erros
     ============================================================ */
  var form = document.getElementById('formContato');
  if (form) {
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function marcar(campo, valido, mensagem) {
      var grupo = campo.closest('.campo');
      if (!grupo) return;
      grupo.classList.toggle('erro', !valido);
      var msg = grupo.querySelector('.msg-erro');
      if (msg) msg.textContent = valido ? '' : mensagem;
      campo.setAttribute('aria-invalid', valido ? 'false' : 'true');
    }

    function validar(campo) {
      var valor = (campo.value || '').trim();
      var id = campo.id;
      if (id === 'nome') return valor.length >= 2 || 'Informe o seu nome.';
      if (id === 'email') return emailOk.test(valor) || 'Informe um e-mail válido, como nome@exemplo.com.';
      if (id === 'assunto') return valor !== '' || 'Escolha um assunto.';
      if (id === 'mensagem') return valor.length >= 10 || 'Conte um pouco mais (mínimo de 10 caracteres).';
      return true;
    }

    form.querySelectorAll('input, select, textarea').forEach(function (campo) {
      if (campo.type === 'checkbox' || campo.type === 'hidden') return;
      campo.addEventListener('blur', function () {
        var r = validar(campo);
        marcar(campo, r === true, typeof r === 'string' ? r : '');
      });
      campo.addEventListener('input', function () {
        var grupo = campo.closest('.campo');
        if (grupo && grupo.classList.contains('erro')) {
          var r = validar(campo);
          marcar(campo, r === true, typeof r === 'string' ? r : '');
        }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var primeiroErro = null;
      var ok = true;

      form.querySelectorAll('input, select, textarea').forEach(function (campo) {
        if (campo.type === 'checkbox' || campo.type === 'hidden') return;
        var r = validar(campo);
        marcar(campo, r === true, typeof r === 'string' ? r : '');
        if (r !== true) { ok = false; if (!primeiroErro) primeiroErro = campo; }
      });

      var aceite = document.getElementById('aceite');
      var grupoAceite = document.getElementById('grupoAceite');
      if (aceite && !aceite.checked) {
        grupoAceite.classList.add('erro');
        ok = false;
        if (!primeiroErro) primeiroErro = aceite;
      } else if (grupoAceite) {
        grupoAceite.classList.remove('erro');
      }

      var status = document.getElementById('formStatus');
      if (!ok) {
        if (status) {
          status.textContent = 'Faltam alguns dados. Confira os campos destacados em vermelho e tente novamente.';
          status.className = 'form-status erro';
        }
        if (primeiroErro) primeiroErro.focus();
        return;
      }

      // honeypot: se preenchido, é robô. Finge sucesso sem enviar.
      var robo = document.getElementById('empresa');
      if (robo && robo.value) { window.location.href = 'obrigado.html'; return; }

      try {
        sessionStorage.setItem('alaafia-contato', JSON.stringify({
          nome: document.getElementById('nome').value.trim(),
          assunto: document.getElementById('assunto').value,
          quando: new Date().toISOString()
        }));
      } catch (err) { /* armazenamento indisponível */ }

      if (status) {
        status.textContent = 'Recebido. Abrindo a página de confirmação...';
        status.className = 'form-status';
      }
      window.location.href = 'obrigado.html';
    });
  }

  /* ---------- Mapa: alternativa se o embed falhar ---------- */
  var mapa = document.getElementById('mapa');
  var mapaFallback = document.getElementById('mapaFallback');
  if (mapa && mapaFallback) {
    var mapaCarregou = false;
    mapa.addEventListener('load', function () { mapaCarregou = true; });
    setTimeout(function () {
      if (!mapaCarregou) {
        mapaFallback.hidden = false;
        mapa.style.display = 'none';
      }
    }, 6000);
  }

  /* ---------- Aviso de cookies ---------- */
  var cookies = document.getElementById('cookies');
  var CHAVE_COOKIES = 'alaafia-cookies';
  function lerCookies() { try { return localStorage.getItem(CHAVE_COOKIES); } catch (e) { return null; } }
  function gravarCookies(valor) { try { localStorage.setItem(CHAVE_COOKIES, valor); } catch (e) { /* sem armazenamento */ } }
  if (cookies && !lerCookies()) {
    setTimeout(function () { cookies.classList.add('visivel'); }, 1800);
  }
  var btnAceitar = document.getElementById('cookiesAceitar');
  var btnRecusar = document.getElementById('cookiesRecusar');
  if (btnAceitar) btnAceitar.addEventListener('click', function () {
    gravarCookies('aceito'); cookies.classList.remove('visivel');
  });
  if (btnRecusar) btnRecusar.addEventListener('click', function () {
    gravarCookies('recusado'); cookies.classList.remove('visivel');
  });

  /* ---------- Página de obrigado: saudação personalizada ---------- */
  var saudacao = document.getElementById('saudacaoObrigado');
  if (saudacao) {
    try {
      var dados = JSON.parse(sessionStorage.getItem('alaafia-contato') || 'null');
      if (dados && dados.nome) {
        var primeiro = dados.nome.split(' ')[0];
        saudacao.textContent = 'Axé, ' + primeiro + '. A sua mensagem chegou à casa.';
      }
    } catch (e) { /* sem dados */ }
  }
})();
