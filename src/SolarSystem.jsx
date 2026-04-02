import React, { useEffect, useRef } from 'react';
import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext';

// A helper function to find where horizontal text lines intersect with our planets
// Returns an array of { x, width } representing free space where text can go.
function getFreeSpans(y, totalWidth, circles, padding = 12) {
    let blocked = [];

    // Calculate horizontal intersections using Pythagorean theorem
    for (const c of circles) {
        const dy = y - c.y;
        if (Math.abs(dy) < c.r) {
            const dx = Math.sqrt(c.r * c.r - dy * dy);
            // Create a blocked zone [startX, endX]
            blocked.push([c.x - dx - padding, c.x + dx + padding]);
        }
    }

    // Merge overlapping blocked zones
    blocked.sort((a, b) => a[0] - b[0]);
    let merged = [];
    for (const b of blocked) {
        if (!merged.length || merged[merged.length - 1][1] < b[0]) {
            merged.push(b);
        } else {
            merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], b[1]);
        }
    }

    // Invert the blocked zones to find the free spans
    let free = [];
    let currentX = 0;
    for (const m of merged) {
        if (m[0] > currentX) {
            free.push({ x: currentX, width: m[0] - currentX });
        }
        currentX = Math.max(currentX, m[1]);
    }
    if (currentX < totalWidth) {
        free.push({ x: currentX, width: totalWidth - currentX });
    }

    return free;
}

export default function SolarSystem() {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const dpr = Math.max(1, window.devicePixelRatio || 1);

        const font = '15px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
        const rawText = 'SOLAR TELEMETRY | ORBITAL LOCK ACTIVE | HELIOCENTRIC TRAJECTORY STABLE | RADIATION INDEX NOMINAL | DEEP SPACE COMM LINK ONLINE | TRANSMISSION DELAY 08m 14s | '.repeat(80);
        const prepared = prepareWithSegments(rawText, font);

        let width = window.innerWidth;
        let height = window.innerHeight;
        let skyGradient = null;
        let vignetteGradient = null;

        const sun = {
            x: 0,
            y: 0,
            r: 0,
            glow: 0
        };

        const planets = [
            { name: 'Mercury', distance: 0, speed: 0.013, size: 0, angle: Math.PI * 0.1, colorA: '#ae9f8f', colorB: '#6a5b4d', ellipse: 0.94 },
            { name: 'Venus', distance: 0, speed: 0.009, size: 0, angle: Math.PI * 0.35, colorA: '#d7b88b', colorB: '#8a6540', ellipse: 0.95 },
            { name: 'Earth', distance: 0, speed: 0.0072, size: 0, angle: Math.PI * 0.5, colorA: '#3f8cff', colorB: '#1953a6', ellipse: 0.96 },
            { name: 'Mars', distance: 0, speed: 0.0058, size: 0, angle: Math.PI * 0.15, colorA: '#d2774f', colorB: '#8c3f25', ellipse: 0.965 },
            { name: 'Jupiter', distance: 0, speed: 0.0034, size: 0, angle: Math.PI * 0.85, colorA: '#d4a77f', colorB: '#9a6a46', ellipse: 0.97 },
            { name: 'Saturn', distance: 0, speed: 0.0027, size: 0, angle: Math.PI * 0.7, colorA: '#dfcc9f', colorB: '#9b8454', ellipse: 0.975, ring: true },
            { name: 'Uranus', distance: 0, speed: 0.0019, size: 0, angle: Math.PI * 1.1, colorA: '#9fe9e8', colorB: '#58a8a7', ellipse: 0.98 },
            { name: 'Neptune', distance: 0, speed: 0.0014, size: 0, angle: Math.PI * 1.4, colorA: '#5d86ff', colorB: '#3052b7', ellipse: 0.985 }
        ];

        const ships = [
            { x: 0, y: 0, baseY: 0, vx: 0, wobble: 16, size: 18, color: '#d9ebff', trail: [] },
            { x: 0, y: 0, baseY: 0, vx: 0, wobble: 20, size: 20, color: '#ffe4be', trail: [] },
            { x: 0, y: 0, baseY: 0, vx: 0, wobble: 23, size: 22, color: '#bfffe0', trail: [] },
            { x: 0, y: 0, baseY: 0, vx: 0, wobble: 26, size: 24, color: '#f9d3ff', trail: [] }
        ];

        const textMotion = {
            linePhase: 0,
            lineAmplitude: 8,
            lineAlphaBoost: 0,
            tickerSpeed: 72,
            tickerOffset: 0
        };

        let stars = [];
        let asteroids = [];

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;

            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            sun.x = width * 0.5;
            sun.y = height * 0.5;
            sun.r = Math.min(width, height) * 0.065;
            sun.glow = sun.r * 3.4;

            const orbitGap = Math.min(width, height) * 0.055;
            const baseDistance = sun.r + orbitGap;
            const planetSizeScale = Math.min(width, height) / 700;
            const baseSizes = [6.5, 10.8, 11.8, 8.7, 24.5, 20.8, 16.2, 16.8];

            planets.forEach((planet, index) => {
                planet.distance = baseDistance + orbitGap * index * 1.12;
                planet.size = Math.max(2, baseSizes[index] * planetSizeScale);
            });

            const shipLanes = [height * 0.24, height * 0.38, height * 0.62, height * 0.78];
            ships.forEach((ship, index) => {
                ship.baseY = shipLanes[index];
                ship.y = ship.baseY;
                ship.x = index % 2 === 0 ? -180 - index * 120 : width + 180 + index * 120;
                ship.vx = index % 2 === 0 ? 1.45 + index * 0.28 : -(1.3 + index * 0.25);
                ship.trail = [];
            });

            const beltCenter = baseDistance + orbitGap * 4.2;
            asteroids = Array.from({ length: 260 }, () => ({
                angle: Math.random() * Math.PI * 2,
                radius: beltCenter + (Math.random() - 0.5) * orbitGap * 0.95,
                ellipse: 0.95 + Math.random() * 0.05,
                size: Math.random() * 1.4 + 0.35,
                speed: 0.0005 + Math.random() * 0.0012,
                alpha: 0.2 + Math.random() * 0.45
            }));

            stars = Array.from({ length: Math.max(180, Math.floor((width * height) / 7000)) }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 1.6 + 0.3,
                alpha: Math.random() * 0.6 + 0.2,
                twinkle: Math.random() * Math.PI * 2,
                drift: (Math.random() - 0.5) * 0.02
            }));

            skyGradient = ctx.createRadialGradient(sun.x, sun.y, sun.r * 0.1, sun.x, sun.y, Math.max(width, height));
            skyGradient.addColorStop(0, '#1a2333');
            skyGradient.addColorStop(0.4, '#080d18');
            skyGradient.addColorStop(1, '#02040a');

            vignetteGradient = ctx.createRadialGradient(sun.x, sun.y, Math.min(width, height) * 0.15, sun.x, sun.y, Math.max(width, height) * 0.75);
            vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.62)');
        };

        const drawPlanet = (planet, x, y) => {
            const lightX = sun.x - x;
            const lightY = sun.y - y;
            const lightDistance = Math.hypot(lightX, lightY) || 1;
            const nx = lightX / lightDistance;
            const ny = lightY / lightDistance;

            const gradient = ctx.createRadialGradient(
                x - nx * planet.size * 0.45,
                y - ny * planet.size * 0.45,
                planet.size * 0.25,
                x,
                y,
                planet.size
            );
            gradient.addColorStop(0, planet.colorA);
            gradient.addColorStop(1, planet.colorB);

            ctx.beginPath();
            ctx.arc(x, y, planet.size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x + nx * planet.size * 0.3, y + ny * planet.size * 0.3, planet.size * 0.85, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fill();

            if (planet.ring) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(-0.45);
                ctx.scale(1.4, 0.45);
                ctx.strokeStyle = 'rgba(224, 207, 162, 0.65)';
                ctx.lineWidth = Math.max(1.2, planet.size * 0.13);
                ctx.beginPath();
                ctx.arc(0, 0, planet.size * 1.5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            if (planet.size >= 10) {
                ctx.fillStyle = 'rgba(225, 234, 255, 0.85)';
                ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
                ctx.textBaseline = 'alphabetic';
                ctx.fillText(planet.name.toUpperCase(), x + planet.size + 6, y - planet.size - 2);
            }
        };

        const drawMoon = (planet, now, orbitScale = 1.85, moonSize = 2.2, speed = 1.5, color = '#d4dcf2') => {
            const moonAngle = now * speed + planet.x * 0.003;
            const moonOrbitX = planet.r * orbitScale;
            const moonOrbitY = moonOrbitX * 0.72;
            const mx = planet.x + Math.cos(moonAngle) * moonOrbitX;
            const my = planet.y + Math.sin(moonAngle) * moonOrbitY;

            ctx.strokeStyle = 'rgba(184, 203, 240, 0.22)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(planet.x, planet.y, moonOrbitX, moonOrbitY, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(mx, my, moonSize, 0, Math.PI * 2);
            ctx.fill();
        };

        const drawShip = (ship, now) => {
            ship.x += ship.vx;
            ship.y = ship.baseY + Math.sin(now * 1.8 + ship.x * 0.012) * ship.wobble;

            if (ship.vx > 0 && ship.x > width + 180) {
                ship.x = -180;
            }
            if (ship.vx < 0 && ship.x < -180) {
                ship.x = width + 180;
            }

            const x = ship.x;
            const y = ship.y;

            ship.trail.push({ x, y });
            if (ship.trail.length > 32) ship.trail.shift();

            ctx.beginPath();
            ship.trail.forEach((p, idx) => {
                const t = idx / ship.trail.length;
                if (idx === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
                ctx.strokeStyle = `rgba(120, 190, 255, ${t * 0.34})`;
            });
            ctx.strokeStyle = 'rgba(120, 190, 255, 0.24)';
            ctx.lineWidth = 1.6;
            ctx.stroke();

            const heading = ship.vx >= 0 ? 0 : Math.PI;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(heading);

            ctx.beginPath();
            ctx.moveTo(ship.size, 0);
            ctx.lineTo(-ship.size * 0.6, ship.size * 0.46);
            ctx.lineTo(-ship.size * 0.4, ship.size * 0.12);
            ctx.lineTo(-ship.size * 0.88, ship.size * 0.14);
            ctx.lineTo(-ship.size * 0.88, -ship.size * 0.14);
            ctx.lineTo(-ship.size * 0.4, -ship.size * 0.12);
            ctx.lineTo(-ship.size * 0.6, -ship.size * 0.46);
            ctx.closePath();
            ctx.fillStyle = ship.color;
            ctx.fill();

            ctx.fillStyle = 'rgba(130, 186, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(ship.size * 0.15, 0, ship.size * 0.22, 0, Math.PI * 2);
            ctx.fill();

            const pulse = 0.65 + Math.sin(now * 10 + ship.x * 0.04) * 0.35;
            ctx.fillStyle = `rgba(88, 180, 255, ${Math.max(0.2, pulse)})`;
            ctx.beginPath();
            ctx.arc(-ship.size * 0.92, 0, ship.size * 0.32, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        };

        const drawCorners = (now) => {
            // Bottom-left: rotating communication dish
            const dishX = 44;
            const dishY = height - 54;
            const dishAngle = -0.65 + Math.sin(now * 1.4) * 0.3;
            ctx.save();
            ctx.translate(dishX, dishY);
            ctx.strokeStyle = 'rgba(183, 223, 255, 0.88)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(18, -42);
            ctx.stroke();
            ctx.translate(18, -42);
            ctx.rotate(dishAngle);
            ctx.beginPath();
            ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(34, -18);
            ctx.strokeStyle = 'rgba(124, 255, 191, 0.65)';
            ctx.stroke();
            ctx.restore();

            // Bottom-right: mission status block
            const panelW = 250;
            const panelH = 86;
            const panelX = width - panelW - 16;
            const panelY = height - panelH - 56;
            ctx.fillStyle = 'rgba(7, 14, 28, 0.58)';
            ctx.fillRect(panelX, panelY, panelW, panelH);
            ctx.strokeStyle = 'rgba(128, 181, 245, 0.62)';
            ctx.strokeRect(panelX, panelY, panelW, panelH);
            ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
            ctx.fillStyle = 'rgba(193, 225, 255, 0.9)';
            ctx.fillText('MISSION CONTROL / LIVE FEED', panelX + 10, panelY + 20);
            ctx.fillText(`UFO SIGNAL: ${Math.floor(74 + Math.sin(now * 3) * 9)}%`, panelX + 10, panelY + 42);
            ctx.fillText(`FLEET SPEED: ${(21 + Math.sin(now * 1.3) * 2).toFixed(1)} km/s`, panelX + 10, panelY + 64);
        };

        const updateTextMotionFromShips = () => {
            const fleetEnergy = ships.reduce((sum, ship) => {
                return sum + Math.abs(ship.vx) + (Math.abs(ship.y - ship.baseY) * 0.02);
            }, 0) / ships.length;

            const targetAmplitude = 4 + fleetEnergy * 2.8;
            const targetTickerSpeed = 56 + fleetEnergy * 16;
            const targetAlphaBoost = Math.min(0.16, fleetEnergy * 0.04);

            textMotion.lineAmplitude += (targetAmplitude - textMotion.lineAmplitude) * 0.06;
            textMotion.tickerSpeed += (targetTickerSpeed - textMotion.tickerSpeed) * 0.08;
            textMotion.lineAlphaBoost += (targetAlphaBoost - textMotion.lineAlphaBoost) * 0.08;
            textMotion.linePhase += 0.008 + fleetEnergy * 0.004;
        };

        const render = () => {
            const now = performance.now() * 0.001;

            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, width, height);

            const nebulaAX = width * 0.18 + Math.sin(now * 0.1) * 60;
            const nebulaAY = height * 0.18 + Math.cos(now * 0.08) * 40;
            const nebulaA = ctx.createRadialGradient(nebulaAX, nebulaAY, 8, nebulaAX, nebulaAY, Math.min(width, height) * 0.34);
            nebulaA.addColorStop(0, 'rgba(78, 129, 204, 0.14)');
            nebulaA.addColorStop(1, 'rgba(78, 129, 204, 0)');
            ctx.fillStyle = nebulaA;
            ctx.fillRect(0, 0, width, height);

            const nebulaBX = width * 0.78 + Math.sin(now * 0.12) * 50;
            const nebulaBY = height * 0.28 + Math.cos(now * 0.07) * 45;
            const nebulaB = ctx.createRadialGradient(nebulaBX, nebulaBY, 8, nebulaBX, nebulaBY, Math.min(width, height) * 0.3);
            nebulaB.addColorStop(0, 'rgba(185, 88, 196, 0.11)');
            nebulaB.addColorStop(1, 'rgba(185, 88, 196, 0)');
            ctx.fillStyle = nebulaB;
            ctx.fillRect(0, 0, width, height);

            stars.forEach((star) => {
                const alpha = star.alpha + Math.sin(now * 0.9 + star.twinkle) * 0.14;
                ctx.fillStyle = `rgba(215, 226, 255, ${Math.max(0.08, alpha)})`;
                const x = (star.x + now * star.drift * 20 + width) % width;
                ctx.beginPath();
                ctx.arc(x, star.y, star.r, 0, Math.PI * 2);
                ctx.fill();
            });

            planets.forEach((planet, orbitIndex) => {
                ctx.beginPath();
                ctx.ellipse(sun.x, sun.y, planet.distance, planet.distance * planet.ellipse, 0, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(140, 165, 215, ${0.055 + orbitIndex * 0.005})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            });

            asteroids.forEach((asteroid) => {
                asteroid.angle += asteroid.speed;
                const ax = sun.x + Math.cos(asteroid.angle) * asteroid.radius;
                const ay = sun.y + Math.sin(asteroid.angle) * asteroid.radius * asteroid.ellipse;
                ctx.fillStyle = `rgba(170, 178, 196, ${asteroid.alpha})`;
                ctx.beginPath();
                ctx.arc(ax, ay, asteroid.size, 0, Math.PI * 2);
                ctx.fill();
            });

            const currentPlanets = planets.map((planet) => {
                planet.angle += planet.speed;
                return {
                    x: sun.x + planet.distance * Math.cos(planet.angle),
                    y: sun.y + (planet.distance * planet.ellipse) * Math.sin(planet.angle),
                    r: planet.size,
                    planet
                };
            });

            const allObstacles = [
                { x: sun.x, y: sun.y, r: sun.r * 1.08 },
                ...currentPlanets.map((p) => ({ x: p.x, y: p.y, r: p.r * 1.15 }))
            ];

            updateTextMotionFromShips();

            const lineHeight = 22;
            let y = 0;
            let cursor = { segmentIndex: 0, graphemeIndex: 0 };

            ctx.fillStyle = 'rgba(208, 220, 245, 0.25)';
            ctx.font = font;
            ctx.textBaseline = 'top';

            while (y < height) {
                const spans = getFreeSpans(y + lineHeight / 2, width, allObstacles, 14);

                for (const span of spans) {
                    if (span.width < 90) continue;

                    const line = layoutNextLine(prepared, cursor, span.width);

                    if (!line) {
                        cursor = { segmentIndex: 0, graphemeIndex: 0 };
                        continue;
                    }

                    const drift = Math.sin(textMotion.linePhase + y * 0.024) * textMotion.lineAmplitude;
                    const lineAlpha = 0.18 + (Math.sin(now * 1.3 + y * 0.03) + 1) * (0.08 + textMotion.lineAlphaBoost);
                    ctx.fillStyle = `rgba(208, 220, 245, ${lineAlpha})`;
                    ctx.fillText(line.text, span.x + drift, y);
                    cursor = line.end;
                }

                y += lineHeight;
            }

            const sunGlow = ctx.createRadialGradient(sun.x, sun.y, sun.r * 0.1, sun.x, sun.y, sun.glow);
            sunGlow.addColorStop(0, 'rgba(255, 241, 186, 0.98)');
            sunGlow.addColorStop(0.25, 'rgba(255, 185, 72, 0.85)');
            sunGlow.addColorStop(1, 'rgba(255, 140, 35, 0)');
            ctx.fillStyle = sunGlow;
            ctx.beginPath();
            ctx.arc(sun.x, sun.y, sun.glow, 0, Math.PI * 2);
            ctx.fill();

            const sunCore = ctx.createRadialGradient(
                sun.x - sun.r * 0.25,
                sun.y - sun.r * 0.25,
                sun.r * 0.2,
                sun.x,
                sun.y,
                sun.r
            );
            sunCore.addColorStop(0, '#fffbe5');
            sunCore.addColorStop(0.45, '#ffd46b');
            sunCore.addColorStop(1, '#ff8c29');
            ctx.fillStyle = sunCore;
            ctx.beginPath();
            ctx.arc(sun.x, sun.y, sun.r, 0, Math.PI * 2);
            ctx.fill();

            currentPlanets.forEach((p) => {
                drawPlanet(p.planet, p.x, p.y);

                if (p.planet.name === 'Earth') {
                    drawMoon(p, now, 2.0, Math.max(1.8, p.r * 0.24), 1.8, '#d7deef');
                }
                if (p.planet.name === 'Mars') {
                    drawMoon(p, now + 1.4, 1.6, Math.max(1.2, p.r * 0.16), 2.4, '#c8b7a3');
                }
                if (p.planet.name === 'Jupiter') {
                    drawMoon(p, now + 0.7, 2.25, Math.max(1.8, p.r * 0.14), 1.1, '#e2d2be');
                    drawMoon(p, now + 2.1, 2.65, Math.max(1.5, p.r * 0.12), 0.95, '#d9d3d8');
                }
            });

            ships.forEach((ship) => {
                drawShip(ship, now);
            });

            drawCorners(now);

            const tickerText = 'EARTH DEPARTURE WINDOW OPEN  |  JUPITER SLINGSHOT TRAJECTORY CONFIRMED  |  SATURN RING PASS IN 14 DAYS  |  ';
            const tickerWidth = ctx.measureText(tickerText).width;
            textMotion.tickerOffset = (textMotion.tickerOffset + textMotion.tickerSpeed * 0.016) % (tickerWidth + width);
            const tickerX = width - textMotion.tickerOffset;
            const tickerY = height - 28;

            ctx.fillStyle = 'rgba(12, 18, 34, 0.62)';
            ctx.fillRect(0, height - 42, width, 42);
            ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
            ctx.fillStyle = 'rgba(187, 221, 255, 0.92)';
            ctx.fillText(tickerText, tickerX, tickerY);
            ctx.fillText(tickerText, tickerX + tickerWidth + 60, tickerY);

            ctx.fillStyle = vignetteGradient;
            ctx.fillRect(0, 0, width, height);

            animationRef.current = requestAnimationFrame(render);
        };

        resize();
        render();
        window.addEventListener('resize', resize);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationRef.current);
        };
    }, []);

    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <canvas ref={canvasRef} style={{ display: 'block' }} />
        </div>
    );
}
