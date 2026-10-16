package com.xstreaming.touchcontrols;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.MotionEvent;
import android.view.View;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;

/**
 * Area kamera geser layar. Menangkap sentuhan langsung di sisi native (seperti
 * AnalogStickView), jadi tidak terpengaruh thread JS yang sibuk. Perhitungan
 * kecepatan jari memakai waktu event sentuh asli, lalu hasilnya dikirim ke JS
 * sebagai nilai analog kanan lewat event onTouchLookChange.
 */
public class TouchLookView extends View {

    private static final long TICK_MS = 16;
    private static final long MIN_EMIT_INTERVAL_MS = 8;
    private static final float EMIT_EPSILON = 0.003f;

    private final LookFilter filter = new LookFilter();
    private final Handler handler = new Handler(Looper.getMainLooper());

    private int activeId = -1;
    private float lastX;
    private float lastY;
    private boolean ticking = false;
    private float lastEmitX = 0f;
    private float lastEmitY = 0f;
    private long lastEmitTime = 0L;

    private final Runnable ticker = new Runnable() {
        @Override
        public void run() {
            onTick();
        }
    };

    public TouchLookView(Context context) {
        super(context);
        filter.setDensity(context.getResources().getDisplayMetrics().density);
    }

    public void setSpeed(float speed) {
        filter.setSpeed(speed);
    }

    public void setSpeedY(float speedY) {
        filter.setSpeedY(speedY);
    }

    public void setSmoothing(float smoothing) {
        filter.setSmoothing(smoothing);
    }

    public void setAntiDeadZone(float antiDeadZone) {
        filter.setAntiDeadZone(antiDeadZone);
    }

    public void setInvertY(boolean invertY) {
        filter.setInvertY(invertY);
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        int action = event.getActionMasked();
        switch (action) {
            case MotionEvent.ACTION_DOWN:
            case MotionEvent.ACTION_POINTER_DOWN: {
                if (activeId != -1) {
                    return false;
                }
                int index = event.getActionIndex();
                activeId = event.getPointerId(index);
                lastX = event.getX(index);
                lastY = event.getY(index);
                filter.clearEvents();
                startTicker();
                return true;
            }
            case MotionEvent.ACTION_MOVE: {
                if (activeId == -1) {
                    return false;
                }
                int index = event.findPointerIndex(activeId);
                if (index < 0) {
                    return true;
                }
                // Sampel riwayat dipakai agar gerakan halus walau event datang bergerombol.
                int history = event.getHistorySize();
                for (int h = 0; h < history; h++) {
                    float hx = event.getHistoricalX(index, h);
                    float hy = event.getHistoricalY(index, h);
                    filter.push(event.getHistoricalEventTime(h), hx - lastX, hy - lastY);
                    lastX = hx;
                    lastY = hy;
                }
                float cx = event.getX(index);
                float cy = event.getY(index);
                filter.push(event.getEventTime(), cx - lastX, cy - lastY);
                lastX = cx;
                lastY = cy;
                emit(false);
                return true;
            }
            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_POINTER_UP:
            case MotionEvent.ACTION_CANCEL: {
                if (activeId == -1) {
                    return false;
                }
                boolean ours = action == MotionEvent.ACTION_CANCEL
                        || event.getPointerId(event.getActionIndex()) == activeId;
                if (!ours) {
                    return true;
                }
                endTouch();
                return true;
            }
            default:
                return activeId != -1;
        }
    }

    private void endTouch() {
        activeId = -1;
        handler.removeCallbacks(ticker);
        ticking = false;
        // Jari diangkat: kamera langsung berhenti (tidak meluncur).
        filter.reset();
        sendEvent(0f, 0f);
    }

    private void startTicker() {
        if (!ticking) {
            ticking = true;
            handler.postDelayed(ticker, TICK_MS);
        }
    }

    private void onTick() {
        if (!ticking) {
            return;
        }
        emit(true);
        if (activeId == -1 && filter.isIdle()) {
            filter.reset();
            sendEvent(0f, 0f);
            ticking = false;
            return;
        }
        handler.postDelayed(ticker, TICK_MS);
    }

    private void emit(boolean force) {
        long now = SystemClock.uptimeMillis();
        if (!force && now - lastEmitTime < MIN_EMIT_INTERVAL_MS) {
            return;
        }
        float[] out = filter.step(now);
        float x = out[0];
        float y = out[1];
        if (Math.abs(x - lastEmitX) < EMIT_EPSILON && Math.abs(y - lastEmitY) < EMIT_EPSILON) {
            return;
        }
        sendEvent(x, y);
    }

    private void sendEvent(float x, float y) {
        lastEmitX = x;
        lastEmitY = y;
        lastEmitTime = SystemClock.uptimeMillis();
        if (getContext() instanceof ReactContext) {
            ReactContext reactContext = (ReactContext) getContext();
            WritableMap event = Arguments.createMap();
            event.putDouble("x", x);
            event.putDouble("y", y);
            reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                    getId(),
                    "onTouchLookChange",
                    event
            );
        }
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        handler.removeCallbacks(ticker);
        ticking = false;
        activeId = -1;
        filter.reset();
        if (lastEmitX != 0f || lastEmitY != 0f) {
            sendEvent(0f, 0f);
        }
    }
}
