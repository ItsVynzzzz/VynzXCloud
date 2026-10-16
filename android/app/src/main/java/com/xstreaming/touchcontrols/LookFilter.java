package com.xstreaming.touchcontrols;

/**
 * Mengubah gerak jari menjadi nilai analog (-1..1) untuk kamera geser layar.
 *
 * Yang diukur adalah KECEPATAN jari, jadi kamera berhenti saat jari berhenti.
 * Dua hal yang membuat terasa seperti game mobile:
 * 1. Kompensasi zona mati game: game biasanya mengabaikan analog di bawah ~20-25%.
 *    Tanpa kompensasi, geseran pelan "tidak terdaftar" sedangkan geseran cepat terdaftar,
 *    sehingga kamera terasa kadang bergerak kadang tidak.
 * 2. Gerakan sangat kecil (getaran jari) diabaikan supaya kamera tidak melayang sendiri.
 *
 * Kelas ini murni Java (tanpa Android) supaya bisa diuji.
 */
public class LookFilter {

    public static final long WINDOW_MS = 40;
    public static final float TICK_MS = 16f;
    // Jarak jari (dp) per 16 ms yang menghasilkan analog penuh pada kecepatan 1x.
    public static final float FULL_DP_PER_TICK = 6f;
    // Di bawah ini dianggap getaran jari, bukan geseran.
    public static final float MIN_MAGNITUDE = 0.04f;
    public static final float IDLE_LIMIT = 0.02f;

    private static final int CAP = 64;

    private final long[] times = new long[CAP];
    private final float[] dxs = new float[CAP];
    private final float[] dys = new float[CAP];
    private int head = 0;
    private int size = 0;

    private float outX = 0f;
    private float outY = 0f;
    private long lastStep = -1;
    private final float[] result = new float[2];

    private float density = 1f;
    private float speed = 1.5f;
    private float speedY = 1f;
    private float smoothing = 0.1f;
    private float antiDeadZone = 0.25f;
    private boolean invertY = false;

    public void setDensity(float density) {
        this.density = density > 0f ? density : 1f;
    }

    public void setSpeed(float speed) {
        this.speed = speed > 0f ? speed : 1f;
    }

    public void setSpeedY(float speedY) {
        this.speedY = speedY > 0f ? speedY : 1f;
    }

    public void setSmoothing(float smoothing) {
        this.smoothing = Math.max(0f, Math.min(smoothing, 0.9f));
    }

    public void setAntiDeadZone(float antiDeadZone) {
        this.antiDeadZone = Math.max(0f, Math.min(antiDeadZone, 0.8f));
    }

    public void setInvertY(boolean invertY) {
        this.invertY = invertY;
    }

    /** Catat satu perpindahan jari (dalam piksel) pada waktu t (ms, basis uptime). */
    public void push(long t, float dx, float dy) {
        if (size == CAP) {
            head = (head + 1) % CAP;
            size--;
        }
        int idx = (head + size) % CAP;
        times[idx] = t;
        dxs[idx] = dx;
        dys[idx] = dy;
        size++;
    }

    public void clearEvents() {
        head = 0;
        size = 0;
    }

    public void reset() {
        clearEvents();
        outX = 0f;
        outY = 0f;
        lastStep = -1;
    }

    public boolean isIdle() {
        return size == 0 && Math.abs(outX) < IDLE_LIMIT && Math.abs(outY) < IDLE_LIMIT;
    }

    private void prune(long now) {
        while (size > 0 && now - times[head] > WINDOW_MS) {
            head = (head + 1) % CAP;
            size--;
        }
    }

    /**
     * Hitung keluaran untuk waktu "now". Aman dipanggil kapan saja (dari event sentuh
     * maupun dari pewaktu); penghalusan memakai selisih waktu sebenarnya.
     * Konvensi sumbu sama dengan analog: jari ke atas = y negatif.
     */
    public float[] step(long now) {
        prune(now);
        float sumX = 0f;
        float sumY = 0f;
        for (int i = 0; i < size; i++) {
            int idx = (head + i) % CAP;
            sumX += dxs[idx];
            sumY += dys[idx];
        }

        float fullPx = Math.max(1f, FULL_DP_PER_TICK * density);
        float perTick = TICK_MS / WINDOW_MS;
        float vx = sumX * perTick / fullPx * speed;
        float vy = sumY * perTick / fullPx * speed * speedY;
        float magnitude = (float) Math.sqrt(vx * vx + vy * vy);

        float targetX = 0f;
        float targetY = 0f;
        if (magnitude >= MIN_MAGNITUDE) {
            float shaped = antiDeadZone + (1f - antiDeadZone) * Math.min(magnitude, 1f);
            float k = shaped / magnitude;
            targetX = vx * k;
            targetY = vy * k;
        }

        float dt = lastStep < 0 ? TICK_MS : Math.max(1f, (float) (now - lastStep));
        lastStep = now;
        float tau = smoothing * 30f;
        float alpha = tau <= 0f ? 1f : 1f - (float) Math.exp(-dt / tau);
        outX += (targetX - outX) * alpha;
        outY += (targetY - outY) * alpha;

        result[0] = outX;
        result[1] = invertY ? -outY : outY;
        return result;
    }
}
