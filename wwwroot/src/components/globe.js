// 2D Globe Alternative - Canvas-based visualization
export function initGlobe(containerId) {


    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`[Globe] Container element '${containerId}' not found!`);
        return null;
    }



    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight || 600;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // Network Points Data - Major Cities
    const networkPoints = [
        { lat: 40.7128, lng: -74.0060, color: '#06b6d4', name: 'New York' },
        { lat: 51.5074, lng: -0.1278, color: '#06b6d4', name: 'London' },
        { lat: 35.6762, lng: 139.6503, color: '#06b6d4', name: 'Tokyo' },
        { lat: 1.3521, lng: 103.8198, color: '#06b6d4', name: 'Singapore' },
        { lat: -33.8688, lng: 151.2093, color: '#06b6d4', name: 'Sydney' },
        { lat: 52.5200, lng: 13.4050, color: '#8b5cf6', name: 'Berlin' },
        { lat: 37.7749, lng: -122.4194, color: '#8b5cf6', name: 'San Francisco' },
        { lat: 55.7558, lng: 37.6173, color: '#8b5cf6', name: 'Moscow' },
        { lat: 19.0760, lng: 72.8777, color: '#06b6d4', name: 'Mumbai' },
        { lat: -23.5505, lng: -46.6333, color: '#8b5cf6', name: 'São Paulo' },
    ];

    // Convert lat/lng to x/y coordinates
    function latLngToXY(lat, lng, width, height) {
        const x = ((lng + 180) / 360) * width;
        const y = ((90 - lat) / 180) * height;
        return { x, y };
    }

    let rotation = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.35;

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw outer glow
        const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius * 1.3);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.1)');
        gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.05)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw main circle (Earth)
        const earthGradient = ctx.createRadialGradient(
            centerX - radius * 0.3,
            centerY - radius * 0.3,
            radius * 0.1,
            centerX,
            centerY,
            radius
        );
        earthGradient.addColorStop(0, '#1a2332');
        earthGradient.addColorStop(0.5, '#0f1419');
        earthGradient.addColorStop(1, '#030712');

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = earthGradient;
        ctx.fill();

        // Draw atmosphere ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw grid lines
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
        ctx.lineWidth = 1;

        // Latitude lines
        for (let i = -60; i <= 60; i += 30) {
            const y = centerY + (i / 90) * radius;
            const width = Math.cos((i * Math.PI) / 180) * radius;
            ctx.beginPath();
            ctx.ellipse(centerX, y, width, radius * 0.1, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Longitude lines
        for (let i = 0; i < 12; i++) {
            const angle = (i * 30 + rotation) * (Math.PI / 180);
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radius * Math.abs(Math.cos(angle)), radius, angle, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw network points
        networkPoints.forEach(point => {
            const angle = ((point.lng + rotation) * Math.PI) / 180;
            const latRad = (point.lat * Math.PI) / 180;

            // Simple 2D projection
            const x = centerX + Math.cos(angle) * Math.cos(latRad) * radius;
            const y = centerY + Math.sin(latRad) * radius;

            // Only draw if on visible hemisphere
            if (Math.cos(angle) > 0) {
                // Glow
                const pointGradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
                pointGradient.addColorStop(0, point.color);
                pointGradient.addColorStop(1, 'transparent');
                ctx.fillStyle = pointGradient;
                ctx.beginPath();
                ctx.arc(x, y, 15, 0, Math.PI * 2);
                ctx.fill();

                // Point
                ctx.fillStyle = point.color;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();

                // Pulse effect
                ctx.strokeStyle = point.color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(x, y, 6 + Math.sin(Date.now() / 500) * 2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        });

        // Draw connection arcs (simplified)
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);

        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], [0, 6], [5, 7], [8, 3]
        ];

        connections.forEach(([i, j]) => {
            const p1 = networkPoints[i];
            const p2 = networkPoints[j];

            const angle1 = ((p1.lng + rotation) * Math.PI) / 180;
            const angle2 = ((p2.lng + rotation) * Math.PI) / 180;
            const lat1 = (p1.lat * Math.PI) / 180;
            const lat2 = (p2.lat * Math.PI) / 180;

            const x1 = centerX + Math.cos(angle1) * Math.cos(lat1) * radius;
            const y1 = centerY + Math.sin(lat1) * radius;
            const x2 = centerX + Math.cos(angle2) * Math.cos(lat2) * radius;
            const y2 = centerY + Math.sin(lat2) * radius;

            if (Math.cos(angle1) > 0 && Math.cos(angle2) > 0) {
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.quadraticCurveTo(
                    (x1 + x2) / 2,
                    (y1 + y2) / 2 - 50,
                    x2,
                    y2
                );
                ctx.stroke();
            }
        });

        ctx.setLineDash([]);

        // Rotate
        rotation += 0.1;
        if (rotation >= 360) rotation = 0;

        requestAnimationFrame(animate);
    }

    animate();


    // Handle resize
    window.addEventListener('resize', () => {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight || 600;
    });

    return { canvas, type: '2D' };
}
