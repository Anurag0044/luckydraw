
        document.addEventListener('DOMContentLoaded', () => {
            // Element References
            const canvas = document.getElementById('wheel-canvas');
            const spinButton = document.getElementById('spin-button');
            
            const prizeModal = document.getElementById('prize-modal');
            const prizeModalContent = prizeModal.querySelector('.modal-content');
            const modalTitle = document.getElementById('modal-title');
            const modalPrize = document.getElementById('modal-prize');
            const closePrizeModalButton = document.getElementById('close-prize-modal-button');

            const qrModal = document.getElementById('qr-modal');
            const qrModalContent = qrModal.querySelector('.modal-content');
            const paymentSuccessButton = document.getElementById('payment-success-button');
            const closeQrModalButton = document.getElementById('close-qr-modal-button');

            const wheelContainer = document.getElementById('wheel-container');
            const ctx = canvas.getContext('2d');
            const pointerTooltip = document.getElementById('pointer-tooltip'); // <-- Add this line

            // Wheel Configuration
            const prizes = [
                { text: "Free Chocolate Bite 🍫", displayText: ["Free", "Chocolate", "Bite"], weight: 20, color: "#C0392B" },
                { text: "₹5 Off Coupon 💸", displayText: ["₹5 Off", "Coupon"], weight: 60, color: "#FFFFFF" },
                { text: "Free Mousse Cupcake 🧁", displayText: ["Free Mousse", "Cupcake"], weight: 0.1, color: "#C0392B", special: true },
                { text: "B1G1 Free Chocolate Bite ✨", displayText: ["B1G1 Free", "Chocolate", "Bite"], weight: 40, color: "#FFFFFF" },
                { text: "Try Again 😅", displayText: ["Try", "Again"], weight: 80, color: "#C0392B" },
                { text: "Free Brownie Bite 🍩", displayText: ["Free", "Brownie", "Bite"], weight: 10, color: "#FFFFFF" },
                { text: "Golden Prize Choco Square 🏆", displayText: ["Golden Prize", "Choco Square"], weight: 0.1, color: "#C0392B", special: true },
                { text: "Free Mineral Water 💧", displayText: ["Free", "Mineral", "Water"], weight: 70, color: "#FFFFFF" },
                { text: "Lucky Combo 🍫🍩", displayText: ["Lucky", "Combo"], weight: 0.1, color: "#FFFFFF", special: true },
                { text: "Do a Dare 😈", displayText: ["Do a", "Dare"], weight: 30, color: "#C0392B" },
            ];
            
            const totalWeight = prizes.reduce((acc, prize) => acc + prize.weight, 0);
            const numSegments = prizes.length;
            const segmentAngle = (2 * Math.PI) / numSegments;
            
            let currentAngle = 0;
            let spinAngleStart = 0;
            let spinTime = 0;
            let spinTimeTotal = 0;
            let isSpinning = false;
            
            // Blinking Lights Configuration
            const lightRadius = 8;
            const numLights = 20;
            let lightBlinkState = 0;

            // --- Canvas and Wheel Drawing ---

            const resizeCanvas = () => {
                const size = wheelContainer.clientWidth;
                canvas.width = size * window.devicePixelRatio;
                canvas.height = size * window.devicePixelRatio;
                canvas.style.width = `${size}px`;
                canvas.style.height = `${size}px`;
                ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                drawWheel();
            };
            
            const drawWheel = () => {
                const size = wheelContainer.clientWidth;
                const radius = size / 2;
                ctx.clearRect(0, 0, size * 2, size * 2);

                ctx.save();
                ctx.translate(radius, radius);
                ctx.rotate(currentAngle);

                // Draw slices
                for (let i = 0; i < numSegments; i++) {
                    const prize = prizes[i];
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.arc(0, 0, radius - 5, -segmentAngle / 2, segmentAngle / 2);
                    ctx.closePath();
                    ctx.fillStyle = prize.color;
                    ctx.fill();

                    // Draw text
                    ctx.save();
                    ctx.rotate(0);
                    const textRadius = radius * 0.65;
                    const textColor = prize.color === '#FFFFFF' ? '#3D2B1F' : '#FFFFFF';
                    ctx.fillStyle = textColor;
                    ctx.font = `bold ${size * 0.04}px Inter, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    const textLines = prize.displayText;
                    const lineHeight = size * 0.045; // A bit more than font size for spacing
                    // Calculate starting Y to center the whole text block
                    const totalTextHeight = (textLines.length - 1) * lineHeight;
                    let startY = -totalTextHeight / 2;
                    
                    textLines.forEach((line, index) => {
                        ctx.fillText(line, textRadius, startY + (index * lineHeight));
                    });

                    ctx.restore();
                    ctx.rotate(segmentAngle);
                }
                ctx.restore();

                // Draw center circle
                ctx.beginPath();
                ctx.arc(radius, radius, radius * 0.1, 0, Math.PI * 2);
                ctx.fillStyle = '#FFD700';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(radius, radius, radius * 0.08, 0, Math.PI * 2);
                ctx.fillStyle = '#3D2B1F';
                ctx.fill();

                drawBlinkingLights(radius, size);
            };

            const drawBlinkingLights = (radius, size) => {
                lightBlinkState += 0.05;
                const lightOuterRadius = radius - lightRadius / 2 - 2;
                for (let i = 0; i < numLights; i++) {
                    const angle = (i / numLights) * 2 * Math.PI;
                    const x = radius + lightOuterRadius * Math.cos(angle);
                    const y = radius + lightOuterRadius * Math.sin(angle);
                    
                    ctx.beginPath();
                    ctx.arc(x, y, lightRadius, 0, 2 * Math.PI);
                    
                    const blinkValue = Math.sin(lightBlinkState + i);
                    if (blinkValue > 0) {
                        ctx.fillStyle = `rgba(255, 215, 0, ${blinkValue})`;
                        ctx.shadowColor = '#FFD700';
                        ctx.shadowBlur = 10;
                    } else {
                        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
                        ctx.shadowBlur = 0;
                    }
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            };
            
            // --- Spinning Logic ---
            
            const getWinningSegment = () => {
                let random = Math.random() * totalWeight;
                for (let i = 0; i < numSegments; i++) {
                    random -= prizes[i].weight;
                    if (random <= 0) {
                        return i;
                    }
                }
                return 0; // Fallback
            };

            const easeOut = (t) => 1 - Math.pow(1 - t, 3);

            const spin = () => {
                if (isSpinning) return;
                isSpinning = true;
                spinButton.disabled = true;
                pointerTooltip.classList.remove('visible'); // Hide tooltip at start of spin
                
                spinAngleStart = Math.random() * 10 + 10; // Random rotations
                spinTime = 0;
                spinTimeTotal = Math.random() * 3 + 4; // Random duration
                
                const winningSegmentIndex = getWinningSegment();
                const segmentCenter = (segmentAngle * winningSegmentIndex) + (segmentAngle / 2);
                const randomOffset = (Math.random() - 0.5) * segmentAngle * 0.8;
                const finalAngle = (Math.PI * 2 * 10) - segmentCenter - randomOffset;

                rotateWheel(finalAngle);
            };

            const rotateWheel = (finalAngle) => {
                const startTime = performance.now();
                
                const animate = (currentTime) => {
                    const timeElapsed = (currentTime - startTime) / 1000;
                    const progress = timeElapsed / spinTimeTotal;
                    
                    if (progress < 1) {
                        const easedProgress = easeOut(progress);
                        currentAngle = easedProgress * finalAngle;
                        drawWheel();
                        
                        // Update tooltip during spin
                        const currentRotation = currentAngle % (2 * Math.PI);
                        const currentIndex = Math.floor(numSegments - (currentRotation / segmentAngle)) % numSegments;
                        updatePointerTooltip(prizes[currentIndex].text);
                        
                        requestAnimationFrame(animate);
                    } else {
                        currentAngle = finalAngle;
                        isSpinning = false;
                        spinButton.disabled = false;
                        drawWheel();
                        
                        const finalRotation = currentAngle % (2 * Math.PI);
                        const winningIndex = Math.floor(numSegments - (finalRotation / segmentAngle)) % numSegments;
                        const winningPrize = prizes[winningIndex];

                        // Format the text to match the popup
                        const emoji = winningPrize.text.split(' ').pop();
                        const prizeText = winningPrize.text.replace(emoji, '').trim();
                        const formattedPrizeText = `${emoji} ${prizeText}`;

                        updatePointerTooltip(formattedPrizeText, true);
                        showPrize(winningPrize);
                    }
                };
                
                requestAnimationFrame(animate);
            };

            const updatePointerTooltip = (text, isWinning = false) => {
                if (!isSpinning && !isWinning) {
                    pointerTooltip.classList.remove('visible');
                    return;
                }
                
                pointerTooltip.textContent = text;
                pointerTooltip.classList.add('visible');
                
                if (isWinning) {
                    // Make the tooltip more prominent for winning prize
                    pointerTooltip.style.transform = 'translateX(-50%) scale(1.1)';
                    pointerTooltip.style.backgroundColor = 'var(--accent-color)';
                    setTimeout(() => {
                        pointerTooltip.classList.remove('visible');
                    }, 3000); // Hide after 3 seconds
                }
            };

            // Animate lights constantly
            const animateLights = () => {
                if (!isSpinning) {
                    drawWheel();
                }
                requestAnimationFrame(animateLights);
            };

            // --- Modal Logic ---
            const showQrModal = () => {
                qrModal.classList.remove('hidden');
                setTimeout(() => {
                   qrModalContent.classList.remove('scale-95', 'opacity-0');
                   qrModalContent.classList.add('scale-100', 'opacity-100');
                }, 10);
            };

            const hideQrModal = () => {
                qrModalContent.classList.add('scale-95', 'opacity-0');
                qrModalContent.classList.remove('scale-100', 'opacity-100');
                setTimeout(() => {
                    qrModal.classList.add('hidden');
                }, 300);
            };

            const hidePrize = () => {
                prizeModalContent.classList.add('scale-95', 'opacity-0');
                prizeModalContent.classList.remove('scale-100', 'opacity-100');
                setTimeout(() => {
                    prizeModal.classList.add('hidden');
                }, 300);
            };

            const showPrize = (prize) => {
                setTimeout(() => {
                    const emoji = prize.text.split(' ').pop();
                    const prizeText = prize.text.replace(emoji, '').trim();
                    
                    modalPrize.className = "mb-6 text-white text-center";
                    modalPrize.innerHTML = '';
                    
                    // Animate emoji and text reveal
                    const textRevealDelay = 100;
                    const totalChars = prizeText.length;
                    let revealedText = '';
                    
                    for (let i = 0; i < totalChars; i++) {
                        setTimeout(() => {
                            revealedText += prizeText[i];
                            modalPrize.innerHTML = `${emoji} ${revealedText}`;
                        }, i * textRevealDelay);
                    }
                    
                    // Show modal after text reveal
                    setTimeout(() => {
                        modalTitle.textContent = "Congratulations!";
                        prizeModal.classList.remove('hidden');
                        prizeModalContent.classList.add('scale-100', 'opacity-100');
                        prizeModalContent.classList.remove('scale-95', 'opacity-0');
                    }, totalChars * textRevealDelay + 500);
                }, 300);
            };

            // Event Listeners
            spinButton.addEventListener('click', showQrModal);

            paymentSuccessButton.addEventListener('click', () => {
                hideQrModal();
                setTimeout(() => {
                    spin();
                }, 300); // Wait for modal to close before spinning
            });

            closeQrModalButton.addEventListener('click', hideQrModal);
            
            // This button is no longer the primary way to spin, but we can keep the logic
            closePrizeModalButton.addEventListener('click', hidePrize);
            window.addEventListener('resize', resizeCanvas);

            // Initial Setup
            resizeCanvas();
            animateLights(); // Start the light animation loop
        });
    