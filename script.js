/**
 * PICCANTE & BELLE — MASTER JAVASCRIPT ARCHITECTURE
 * 3D WebGL (Three.js), GSAP Motion & Pinned Transitions,
 * Calabria Soundscape (Web Audio API), 3D Card Tilt & Interactive E-Commerce
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. UTILITIES & SOUND MICRO-FEEDBACK (Synthesized Audio)
  // =========================================================================
  const AudioEngine = {
    ctx: null,
    isPlaying: false,
    breezeSource: null,
    breezeGain: null,
    cicadaSource: null,
    cicadaGain: null,
    masterGain: null,

    init() {
      if (this.ctx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    },

    playMicroClick(freq = 600, duration = 0.04) {
      try {
        this.init();
        if (!this.ctx || this.ctx.state === 'suspended') {
          this.ctx?.resume();
        }
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.4, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Silent catch for audio policy restrictions
      }
    },

    toggleCalabriaSoundscape(buttonEl) {
      this.init();
      if (!this.ctx) return;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      if (this.isPlaying) {
        // Fade out
        const now = this.ctx.currentTime;
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
        setTimeout(() => {
          try {
            this.breezeSource?.stop();
            this.cicadaSource?.stop();
          } catch (e) {}
          this.isPlaying = false;
          if (buttonEl) {
            buttonEl.classList.remove('playing');
            buttonEl.querySelector('.sound-icon-on')?.classList.add('hidden');
            buttonEl.querySelector('.sound-icon-off')?.classList.remove('hidden');
          }
        }, 800);
        showToast('Ambiance suspendue', 'Atmosphère sonore de Calabre désactivée');
      } else {
        // Create Mediterranean sea breeze (Pink Noise + Bandpass LFO)
        const bufferSize = this.ctx.sampleRate * 3;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }

        this.breezeSource = this.ctx.createBufferSource();
        this.breezeSource.buffer = noiseBuffer;
        this.breezeSource.loop = true;

        const breezeFilter = this.ctx.createBiquadFilter();
        breezeFilter.type = 'bandpass';
        breezeFilter.frequency.setValueAtTime(380, this.ctx.currentTime);
        breezeFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

        // LFO for breeze swell (waves of the Strait of Messina)
        const lfo = this.ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.14, this.ctx.currentTime);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(180, this.ctx.currentTime);
        lfo.connect(breezeFilter.frequency);
        lfo.start();

        this.breezeGain = this.ctx.createGain();
        this.breezeGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

        this.breezeSource.connect(breezeFilter);
        breezeFilter.connect(this.breezeGain);

        // Mediterranean Cicada Whisper (Filtered rhythmic oscillator)
        const cicadaBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
        const cicadaData = cicadaBuffer.getChannelData(0);
        for (let i = 0; i < cicadaData.length; i++) {
          const t = i / this.ctx.sampleRate;
          const pulse = Math.sin(2 * Math.PI * 7.5 * t) > 0 ? 1 : 0;
          cicadaData[i] = (Math.random() * 2 - 1) * pulse * 0.15;
        }
        this.cicadaSource = this.ctx.createBufferSource();
        this.cicadaSource.buffer = cicadaBuffer;
        this.cicadaSource.loop = true;

        const cicadaFilter = this.ctx.createBiquadFilter();
        cicadaFilter.type = 'bandpass';
        cicadaFilter.frequency.setValueAtTime(6200, this.ctx.currentTime);
        cicadaFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

        this.cicadaGain = this.ctx.createGain();
        this.cicadaGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

        this.cicadaSource.connect(cicadaFilter);
        cicadaFilter.connect(this.cicadaGain);

        // Master Gain
        this.masterGain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        this.masterGain.gain.setValueAtTime(0.0001, now);
        this.masterGain.gain.linearRampToValueAtTime(0.18, now + 1.8);

        this.breezeGain.connect(this.masterGain);
        this.cicadaGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.breezeSource.start();
        this.cicadaSource.start();
        this.isPlaying = true;

        if (buttonEl) {
          buttonEl.classList.add('playing');
          buttonEl.querySelector('.sound-icon-off')?.classList.add('hidden');
          buttonEl.querySelector('.sound-icon-on')?.classList.remove('hidden');
        }
        showToast('Atmosphère de Calabre active', 'Brise marine du détroit de Messine & chant des cigales');
      }
    }
  };

  // Toast System
  let toastTimer = null;
  function showToast(title, desc) {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toast-title');
    const toastDesc = document.getElementById('toast-desc');
    if (!toast) return;

    if (toastTitle) toastTitle.textContent = title;
    if (toastDesc) toastDesc.textContent = desc;

    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  // =========================================================================
  // 2. INTERACTIVE ANATOMIE HOTSPOTS (EDITORIAL SHOWCASE)
  // =========================================================================
  function initAnatomieHotspots() {
    const pins = document.querySelectorAll('.photo-hotspot-pin');
    const cards = document.querySelectorAll('.anatomie-cards-col .hotspot-card');
    if (!pins.length || !cards.length) return;

    function activateHotspot(targetId) {
      pins.forEach((pin) => {
        const isMatch = pin.getAttribute('data-target') === targetId;
        pin.classList.toggle('active', isMatch);
      });

      cards.forEach((card) => {
        const isMatch = card.getAttribute('data-hotspot') === targetId;
        card.classList.toggle('active', isMatch);
      });

      AudioEngine.playMicroClick(580, 0.04);
    }

    pins.forEach((pin) => {
      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = pin.getAttribute('data-target');
        activateHotspot(target);
      });
      pin.addEventListener('mouseenter', () => {
        const target = pin.getAttribute('data-target');
        activateHotspot(target);
      });
    });

    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const target = card.getAttribute('data-hotspot');
        activateHotspot(target);
      });
      card.addEventListener('mouseenter', () => {
        const target = card.getAttribute('data-hotspot');
        activateHotspot(target);
      });
    });

    // Default activate first hotspot (pipette)
    activateHotspot('pipette');
  }

  // =========================================================================
  // 5. 3D CARD TILT WITH HOLOGRAPHIC SPECULAR HIGHLIGHT
  // =========================================================================
  function init3DCardTilt() {
    const cards = document.querySelectorAll('.tilt-card');
    cards.forEach((card) => {
      // Ensure glare overlay
      let glare = card.querySelector('.tilt-card-glare');
      if (!glare) {
        glare = document.createElement('div');
        glare.className = 'tilt-card-glare';
        card.appendChild(glare);
      }

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = -((y - centerY) / centerY) * 7.5; // Max 7.5 deg
        const rotateY = ((x - centerX) / centerX) * 7.5;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;
        card.style.setProperty('--glare-x', `${(x / rect.width) * 100}%`);
        card.style.setProperty('--glare-y', `${(y / rect.height) * 100}%`);
        card.style.setProperty('--glare-opacity', '0.65');
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.setProperty('--glare-opacity', '0');
      });
    });
  }

  // =========================================================================
  // 6. CUSTOM MAGNETIC CURSOR & MAGNETIC TARGETS
  // =========================================================================
  function initCustomMagneticCursor() {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    // Hide custom cursor on touch-only devices
    if (window.matchMedia('(pointer: coarse)').matches) {
      dot.style.display = 'none';
      ring.style.display = 'none';
      return;
    }

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isHoveringInteractive = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    });

    // Magnetic attraction on interactive targets
    const magneticTargets = document.querySelectorAll('.magnetic-target, a, button, [role="button"]');
    magneticTargets.forEach((target) => {
      target.addEventListener('mouseenter', () => {
        isHoveringInteractive = true;
        ring.style.width = '52px';
        ring.style.height = '52px';
        ring.style.borderColor = 'rgba(196, 130, 63, 0.7)';
        ring.style.backgroundColor = 'rgba(196, 130, 63, 0.08)';
      });

      target.addEventListener('mousemove', (e) => {
        if (!target.classList.contains('magnetic-target')) return;
        const rect = target.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const pullX = (e.clientX - centerX) * 0.25;
        const pullY = (e.clientY - centerY) * 0.25;
        target.style.transform = `translate(${pullX.toFixed(1)}px, ${pullY.toFixed(1)}px)`;
      });

      target.addEventListener('mouseleave', () => {
        isHoveringInteractive = false;
        ring.style.width = '32px';
        ring.style.height = '32px';
        ring.style.borderColor = 'var(--gold-border)';
        ring.style.backgroundColor = 'transparent';
        if (target.classList.contains('magnetic-target')) {
          target.style.transform = 'translate(0px, 0px)';
        }
      });
    });

    function renderCursor() {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      ring.style.transform = `translate(${ringX - (isHoveringInteractive ? 26 : 16)}px, ${ringY - (isHoveringInteractive ? 26 : 16)}px)`;
      requestAnimationFrame(renderCursor);
    }
    renderCursor();
  }

  // =========================================================================
  // 7. GSAP SCROLLTRIGGER: PINNED HORIZONTAL GALLERY & TEXT SCRUB
  // =========================================================================
  function initGSAPTransitions() {
    if (typeof gsap === 'undefined') return;

    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    // 1. Header Scrolled State
    const header = document.getElementById('main-header');
    if (header) {
      window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 40);
      }, { passive: true });
    }

    // 2. Cinematic Text Reveal Quote
    const quoteEl = document.getElementById('gsap-scrub-text');
    if (quoteEl && typeof ScrollTrigger !== 'undefined') {
      const words = quoteEl.innerText.trim().split(/\s+/);
      quoteEl.innerHTML = words.map((w) => `<span class="word">${w}</span>`).join(' ');

      const wordSpans = quoteEl.querySelectorAll('.word');
      gsap.to(wordSpans, {
        scrollTrigger: {
          trigger: '#terroir',
          start: 'top 80%',
          end: 'bottom 40%',
          scrub: 0.5
        },
        className: 'word lit',
        stagger: 0.05
      });
    }

    // 3. Pinned Horizontal Journey Gallery
    const track = document.getElementById('horizontal-track');
    const pinContainer = document.getElementById('pin-container');
    const stepCounter = document.getElementById('journey-step-counter');
    const journeyBar = document.getElementById('journey-bar');

    if (track && pinContainer && typeof ScrollTrigger !== 'undefined') {
      const updateJourneyMetrics = () => {
        const trackWidth = track.scrollWidth;
        const windowWidth = window.innerWidth;
        const distance = trackWidth - windowWidth + (windowWidth * 0.1);

        if (distance > 0 && window.innerWidth >= 768) {
          gsap.to(track, {
            x: () => -distance,
            ease: 'none',
            scrollTrigger: {
              trigger: pinContainer,
              pin: true,
              scrub: 1,
              start: 'top top',
              end: () => `+=${distance + 400}`,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                const progress = self.progress;
                if (journeyBar) {
                  journeyBar.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
                }
                if (stepCounter) {
                  const step = Math.min(4, Math.floor(progress * 4) + 1);
                  stepCounter.textContent = `0${step} / 04`;
                }
              }
            }
          });
        }
      };

      updateJourneyMetrics();
      window.addEventListener('resize', () => {
        ScrollTrigger.refresh();
      });
    }
  }

  // =========================================================================
  // 8. INTERACTIVE BEFORE / AFTER SLIDER (PRECISION CURTAIN)
  // =========================================================================
  function initCurtainSlider() {
    const container = document.getElementById('curtain-container');
    const overlay = document.getElementById('curtain-overlay');
    const handle = document.getElementById('curtain-handle');
    if (!container || !overlay || !handle) return;

    let isSliding = false;

    const updateSliderWidth = () => {
      const width = container.clientWidth;
      container.style.setProperty('--curtain-full-width', `${width}px`);
    };
    updateSliderWidth();
    window.addEventListener('resize', updateSliderWidth);

    const setPosition = (clientX) => {
      const rect = container.getBoundingClientRect();
      let posX = clientX - rect.left;
      posX = Math.max(0, Math.min(posX, rect.width));
      const percentage = (posX / rect.width) * 100;

      overlay.style.width = `${percentage}%`;
      handle.style.left = `${percentage}%`;
    };

    container.addEventListener('mousedown', (e) => {
      isSliding = true;
      setPosition(e.clientX);
      AudioEngine.playMicroClick(400, 0.03);
    });

    window.addEventListener('mousemove', (e) => {
      if (!isSliding) return;
      setPosition(e.clientX);
    });

    window.addEventListener('mouseup', () => {
      isSliding = false;
    });

    container.addEventListener('touchstart', (e) => {
      isSliding = true;
      setPosition(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isSliding || !e.touches[0]) return;
      setPosition(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isSliding = false;
    });
  }

  // =========================================================================
  // 9. RITUEL QUOTIDIEN TABS TRANSITIONS
  // =========================================================================
  function initRituelTabs() {
    const tabs = document.querySelectorAll('.rituel-tab-card');
    const panes = document.querySelectorAll('.rituel-content-pane');
    const dosageTag = document.getElementById('stage-dosage-tag');

    const dosageLabels = {
      visage: '2 à 3 gouttes',
      cernes: '1 goutte délicate',
      cicatrices: '3 à 5 gouttes ciblées',
      cheveux: '2 gouttes chauffées'
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetKey = tab.getAttribute('data-tab');
        if (!targetKey) return;

        AudioEngine.playMicroClick(520, 0.04);

        tabs.forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        panes.forEach((p) => {
          p.classList.add('hidden');
          p.classList.remove('active');
        });

        const targetPane = document.getElementById(`pane-${targetKey}`);
        if (targetPane) {
          targetPane.classList.remove('hidden');
          requestAnimationFrame(() => targetPane.classList.add('active'));
        }

        if (dosageTag && dosageLabels[targetKey]) {
          dosageTag.textContent = dosageLabels[targetKey];
          dosageTag.style.transform = 'scale(1.15)';
          setTimeout(() => (dosageTag.style.transform = 'scale(1)'), 250);
        }
      });
    });
  }

  // =========================================================================
  // 10. BOUTIQUE, BUY-BOX & INTERACTIVE CART DRAWER
  // =========================================================================
  function initBoutiqueAndCart() {
    // Format Picker
    const volumeBtns = document.querySelectorAll('.vol-card-btn');
    const displayPrice = document.getElementById('product-display-price');
    let currentPrice = 54.0;
    let currentFormatName = '30 ml';

    volumeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        volumeBtns.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');

        const priceAttr = btn.getAttribute('data-price');
        const sizeAttr = btn.getAttribute('data-size');
        if (priceAttr) {
          currentPrice = parseFloat(priceAttr);
          if (displayPrice) {
            displayPrice.textContent = `${currentPrice.toFixed(2).replace('.', ',')} €`;
          }
        }
        currentFormatName = btn.querySelector('.vol-size-name')?.textContent || sizeAttr || '30 ml';
        AudioEngine.playMicroClick(650, 0.04);
      });
    });

    // Quantity Stepper
    let quantity = 1;
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');
    const qtyNum = document.getElementById('qty-num');

    if (qtyMinus && qtyPlus && qtyNum) {
      qtyMinus.addEventListener('click', () => {
        if (quantity > 1) {
          quantity--;
          qtyNum.textContent = quantity;
          AudioEngine.playMicroClick(420, 0.03);
        }
      });

      qtyPlus.addEventListener('click', () => {
        if (quantity < 10) {
          quantity++;
          qtyNum.textContent = quantity;
          AudioEngine.playMicroClick(480, 0.03);
        }
      });
    }

    // Cart State & Drawer
    const cartState = [
      {
        id: 'bottle-30',
        name: "Olio Puro di Fico d'India",
        size: '30 ml',
        price: 54.0,
        qty: 1,
        img: 'assets/images/hero-bottle.jpg'
      }
    ];

    const cartTrigger = document.getElementById('cart-trigger');
    const cartCloseBtn = document.getElementById('cart-close-btn');
    const cartDrawer = document.getElementById('cart-drawer-overlay');
    const cartCounter = document.getElementById('cart-counter');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartShippingEl = document.getElementById('cart-shipping-cost');
    const cartTotalEl = document.getElementById('cart-total');
    const shippingBar = document.getElementById('shipping-bar');
    const shippingMsg = document.getElementById('shipping-msg');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');

    const updateCartUI = () => {
      const totalCount = cartState.reduce((sum, item) => sum + item.qty, 0);
      if (cartCounter) cartCounter.textContent = totalCount;

      let subtotal = cartState.reduce((sum, item) => sum + item.price * item.qty, 0);
      const freeShippingThreshold = 60.0;
      const isFreeShipping = subtotal >= freeShippingThreshold || subtotal === 0;
      const shippingCost = isFreeShipping ? 0 : 4.9;
      const grandTotal = subtotal + shippingCost;

      if (cartSubtotalEl) cartSubtotalEl.textContent = `${subtotal.toFixed(2).replace('.', ',')} €`;
      if (cartShippingEl) {
        cartShippingEl.textContent = isFreeShipping ? 'Offerte dès 60 €' : '4,90 €';
        cartShippingEl.className = isFreeShipping ? 'text-green font-bold' : 'text-espresso font-bold';
      }
      if (cartTotalEl) cartTotalEl.textContent = `${grandTotal.toFixed(2).replace('.', ',')} €`;

      // Free shipping threshold progress bar
      if (shippingBar && shippingMsg) {
        if (subtotal >= freeShippingThreshold) {
          shippingBar.style.width = '100%';
          shippingMsg.innerHTML = 'Félicitations ! Vous bénéficiez de <strong>l\'expédition offerte</strong> en Calabre et en Europe.';
        } else {
          const remaining = freeShippingThreshold - subtotal;
          const pct = Math.min(100, Math.max(5, (subtotal / freeShippingThreshold) * 100));
          shippingBar.style.width = `${pct}%`;
          shippingMsg.innerHTML = `Ajoutez encore <span class="font-bold text-gold">${remaining.toFixed(2).replace('.', ',')} €</span> pour débloquer l'expédition offerte.`;
        }
      }

      // Render cart items
      if (cartItemsContainer) {
        if (cartState.length === 0) {
          cartItemsContainer.innerHTML = `
            <div style="padding: 3rem 1rem; text-align: center; color: var(--text-muted);">
              <p>Votre panier est actuellement vide.</p>
              <a href="#boutique" class="btn-secondary-island mt-4" style="display: inline-block;">Explorer l'Élixir</a>
            </div>
          `;
        } else {
          cartItemsContainer.innerHTML = cartState.map((item, idx) => `
            <div class="cart-item-card" style="display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid var(--border-hairline); align-items: center;">
              <img src="${item.img}" alt="${item.name}" style="width: 64px; height: 64px; object-fit: cover; border-radius: var(--radius-md);">
              <div style="flex: 1;">
                <h4 style="font-size: 0.95rem; font-weight: 600; color: var(--espresso);">${item.name}</h4>
                <span style="font-size: 0.8rem; color: var(--gold-rich);">${item.size}</span>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.5rem;">
                  <div class="qty-stepper" style="padding: 0.2rem 0.5rem; gap: 0.4rem;">
                    <button class="cart-qty-btn magnetic-target" data-idx="${idx}" data-delta="-1" style="font-weight: bold; cursor: pointer;">-</button>
                    <span style="font-size: 0.85rem; font-weight: 600;">${item.qty}</span>
                    <button class="cart-qty-btn magnetic-target" data-idx="${idx}" data-delta="1" style="font-weight: bold; cursor: pointer;">+</button>
                  </div>
                  <strong style="font-size: 0.95rem; color: var(--espresso);">${(item.price * item.qty).toFixed(2).replace('.', ',')} €</strong>
                </div>
              </div>
            </div>
          `).join('');

          cartItemsContainer.querySelectorAll('.cart-qty-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
              const idx = parseInt(btn.getAttribute('data-idx'), 10);
              const delta = parseInt(btn.getAttribute('data-delta'), 10);
              if (cartState[idx]) {
                cartState[idx].qty += delta;
                if (cartState[idx].qty <= 0) {
                  cartState.splice(idx, 1);
                }
                AudioEngine.playMicroClick(450, 0.03);
                updateCartUI();
              }
            });
          });
        }
      }
    };
    updateCartUI();

    const openCartDrawer = () => {
      if (cartDrawer) {
        cartDrawer.classList.add('open');
        cartDrawer.setAttribute('aria-hidden', 'false');
        AudioEngine.playMicroClick(600, 0.04);
      }
    };

    const closeCartDrawer = () => {
      if (cartDrawer) {
        cartDrawer.classList.remove('open');
        cartDrawer.setAttribute('aria-hidden', 'true');
      }
    };

    if (cartTrigger) cartTrigger.addEventListener('click', openCartDrawer);
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCartDrawer);
    if (cartDrawer) {
      cartDrawer.addEventListener('click', (e) => {
        if (e.target === cartDrawer) closeCartDrawer();
      });
    }

    // Add to cart action
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => {
        const existing = cartState.find((item) => item.size === currentFormatName);
        if (existing) {
          existing.qty += quantity;
        } else {
          cartState.push({
            id: `bottle-${currentFormatName}`,
            name: "Olio Puro di Fico d'India",
            size: currentFormatName,
            price: currentPrice,
            qty: quantity,
            img: 'assets/images/hero-bottle.jpg'
          });
        }
        updateCartUI();
        AudioEngine.playMicroClick(800, 0.06);
        showToast('Article ajouté au panier', `${quantity}× Flacon ${currentFormatName} — Piccante & Belle`);
        setTimeout(openCartDrawer, 400);
      });
    }

    // Checkout button
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        AudioEngine.playMicroClick(880, 0.08);
        showToast('Commande en cours de sécurisation', 'Redirection vers la passerelle de paiement bancaire SSL...');
      });
    }
  }

  // =========================================================================
  // 11. FAQ ACCORDION
  // =========================================================================
  function initFAQ() {
    const faqButtons = document.querySelectorAll('.faq-toggle-btn');
    faqButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        const body = btn.nextElementSibling;
        const icon = btn.querySelector('.faq-icon-cross');

        // Close others
        faqButtons.forEach((other) => {
          if (other !== btn) {
            other.setAttribute('aria-expanded', 'false');
            if (other.nextElementSibling) other.nextElementSibling.style.maxHeight = null;
            const otherIcon = other.querySelector('.faq-icon-cross');
            if (otherIcon) otherIcon.textContent = '+';
          }
        });

        btn.setAttribute('aria-expanded', !isExpanded);
        if (!isExpanded && body) {
          body.style.maxHeight = `${body.scrollHeight + 30}px`;
          if (icon) icon.textContent = '−';
        } else if (body) {
          body.style.maxHeight = null;
          if (icon) icon.textContent = '+';
        }
        AudioEngine.playMicroClick(isExpanded ? 400 : 540, 0.04);
      });
    });
  }

  // =========================================================================
  // 12. MOBILE MENU & SOUNDSCAPE BUTTON
  // =========================================================================
  function initNavAndSoundscape() {
    // Soundscape Header Button
    const soundscapeBtn = document.getElementById('soundscape-btn');
    if (soundscapeBtn) {
      soundscapeBtn.addEventListener('click', () => {
        AudioEngine.toggleCalabriaSoundscape(soundscapeBtn);
      });
    }

    // Mobile Menu
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileClose = document.getElementById('mobile-close');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    const openMenu = () => {
      if (mobileMenu) {
        mobileMenu.classList.add('open');
        mobileMenu.setAttribute('aria-hidden', 'false');
        mobileToggle?.setAttribute('aria-expanded', 'true');
        AudioEngine.playMicroClick(500, 0.04);
      }
    };

    const closeMenu = () => {
      if (mobileMenu) {
        mobileMenu.classList.remove('open');
        mobileMenu.setAttribute('aria-hidden', 'true');
        mobileToggle?.setAttribute('aria-expanded', 'false');
      }
    };

    if (mobileToggle) mobileToggle.addEventListener('click', openMenu);
    if (mobileClose) mobileClose.addEventListener('click', closeMenu);
    mobileLinks.forEach((l) => l.addEventListener('click', closeMenu));

    // Newsletter
    const nlForm = document.getElementById('newsletter-form');
    const nlFeedback = document.getElementById('newsletter-feedback');
    if (nlForm) {
      nlForm.addEventListener('submit', (e) => {
        e.preventDefault();
        AudioEngine.playMicroClick(700, 0.05);
        if (nlFeedback) {
          nlFeedback.classList.remove('hidden');
          nlForm.reset();
        }
        showToast('Bienvenue au Domaine', 'Votre inscription aux correspondances de Calabre est confirmée.');
      });
    }
  }

  // =========================================================================
  // INITIALIZATION ON DOM READY
  // =========================================================================
  window.addEventListener('DOMContentLoaded', () => {
    initAnatomieHotspots();
    init3DCardTilt();
    initCustomMagneticCursor();
    initGSAPTransitions();
    initCurtainSlider();
    initRituelTabs();
    initBoutiqueAndCart();
    initFAQ();
    initNavAndSoundscape();
  });

})();