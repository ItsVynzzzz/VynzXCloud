package com.xstreaming.touchcontrols;

import android.content.Context;
import android.content.res.TypedArray;
import android.graphics.Canvas;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.util.AttributeSet;
import android.view.MotionEvent;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.xstreaming.R;

public class AnalogStickView extends CustomView {

    private static final float DEAD_ZONE = 0.10f;
    private float radius = 100f;
    private float handleRadius = 30f;
    private Drawable drawableBase;
    private Drawable drawableHandle;

    private Vector state = new Vector(0f, 0f);
    private StateChangedCallback stateChangedCallback;

    private TouchTracker touchTracker;
    private Vector center;
    private float homeFx = -1f;
    private float homeFy = -1f;
    private Vector handlePosition = new Vector(0f, 0f);

    public interface StateChangedCallback {
        void onStateChanged(Vector state);
    }

    public AnalogStickView(Context context) {
        this(context, null);
    }

    public AnalogStickView(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public AnalogStickView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init(context, attrs);
    }

    private void init(Context context, AttributeSet attrs) {
        if (attrs != null) {
            try {
                TypedArray a = context.getTheme().obtainStyledAttributes(
                        attrs,
                        R.styleable.AnalogStickView,
                        0, 0);

                radius = a.getDimension(R.styleable.AnalogStickView_radius, 100f);
                handleRadius = a.getDimension(R.styleable.AnalogStickView_handleRadius, 30f);
                drawableBase = a.getDrawable(R.styleable.AnalogStickView_drawableBase);
                drawableHandle = a.getDrawable(R.styleable.AnalogStickView_drawableHandle);
                a.recycle();
            } catch (Exception e) {
                setDefaultDrawables();
            }
        } else {
            setDefaultDrawables();
        }

        initTouchTracker();
    }

    private void setDefaultDrawables() {
        try {
            drawableBase = ContextCompat.getDrawable(getContext(), R.drawable.control_analog_stick_base);
            drawableHandle = ContextCompat.getDrawable(getContext(), R.drawable.control_analog_stick_handle);
        } catch (Exception e) {
            createFallbackDrawables();
        }
    }

    private void createFallbackDrawables() {
        android.graphics.drawable.GradientDrawable baseDrawable = new android.graphics.drawable.GradientDrawable();
        baseDrawable.setShape(android.graphics.drawable.GradientDrawable.OVAL);
        baseDrawable.setColor(0x80FFFFFF);
        baseDrawable.setStroke(2, 0xFFFFFFFF);
        drawableBase = baseDrawable;

        android.graphics.drawable.GradientDrawable handleDrawable = new android.graphics.drawable.GradientDrawable();
        handleDrawable.setShape(android.graphics.drawable.GradientDrawable.OVAL);
        handleDrawable.setColor(0xFFFFFFFF);
        handleDrawable.setStroke(1, 0xFFCCCCCC);
        drawableHandle = handleDrawable;
    }

    private void initTouchTracker() {
        touchTracker = new TouchTracker();
        touchTracker.setPositionChangedCallback(new TouchTracker.PositionChangedCallback() {
            @Override
            public void onPositionChanged(Vector position) {
                updateState(position);
            }
        });
    }

    // React Native Properties
    public void setRadius(float radius) {
        this.radius = radius;
        invalidate();
    }

    public void setHandleRadius(float handleRadius) {
        this.handleRadius = handleRadius;
        invalidate();
    }

    public void setHomeX(float fx) {
        this.homeFx = fx;
        invalidate();
    }

    public void setHomeY(float fy) {
        this.homeFy = fy;
        invalidate();
    }

    private Vector getHome() {
        if (homeFx < 0f || homeFy < 0f || getWidth() == 0 || getHeight() == 0) {
            return null;
        }
        return new Vector(getWidth() * homeFx, getHeight() * homeFy);
    }

    public float getRadius() {
        return radius;
    }

    public float getHandleRadius() {
        return handleRadius;
    }

    public void setStateChangedCallback(StateChangedCallback callback) {
        this.stateChangedCallback = callback;
    }

    public Vector getState() {
        return state;
    }

    private void setState(Vector value) {
        this.state = value;
        if (stateChangedCallback != null) {
            stateChangedCallback.onStateChanged(state);
        }
        sendEventToReactNative();
    }

    private void sendEventToReactNative() {
        if (getContext() instanceof ReactContext) {
            ReactContext reactContext = (ReactContext) getContext();
            WritableMap event = Arguments.createMap();
            event.putDouble("x", state.x);
            event.putDouble("y", state.y);

            reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
                    getId(),
                    "onAnalogStickChange",
                    event
            );
        }
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        Vector c = (center != null) ? center : getHome();
        if (c != null) {
            float circleRadius = radius + handleRadius;

            if (drawableBase != null) {
                drawableBase.setBounds(
                        (int) (c.x - circleRadius),
                        (int) (c.y - circleRadius),
                        (int) (c.x + circleRadius),
                        (int) (c.y + circleRadius)
                );
                drawableBase.draw(canvas);
            }

            float handleX = c.x + handlePosition.x * radius;
            float handleY = c.y + handlePosition.y * radius;

            if (drawableHandle != null) {
                drawableHandle.setBounds(
                        (int) (handleX - handleRadius),
                        (int) (handleY - handleRadius),
                        (int) (handleX + handleRadius),
                        (int) (handleY + handleRadius)
                );
                drawableHandle.draw(canvas);
            }
        }
    }

    private void updateState(Vector position) {
        if (radius <= 0f) {
            return;
        }

        if (position == null) {
            center = null;
            setState(new Vector(0f, 0f));
            handlePosition = new Vector(0f, 0f);
            invalidate();
            return;
        }

        if (center == null) {
            Vector home = getHome();
            if (home != null && position.minus(home).getLength() <= radius + handleRadius) {
                center = home;
            } else {
                center = position;
            }
        }

        Vector dir = position.minus(center);
        float length = dir.getLength();
        if (length > radius) {
            // Pusat analog ikut bergeser ke arah jari, jadi jempol tidak perlu kembali jauh
            center = center.plus(dir.divide(length).times(length - radius));
            dir = position.minus(center);
            length = dir.getLength();
        }
        if (length > 0) {
            float rawStrength = length > radius ? 1.0f : length / radius;
            float strength = rawStrength <= DEAD_ZONE ? 0f : (rawStrength - DEAD_ZONE) / (1f - DEAD_ZONE);
            Vector dirNormalized = dir.divide(length);
            handlePosition = dirNormalized.times(rawStrength);
            Vector dirBoxNormalized;

            if (Math.abs(dirNormalized.x) > Math.abs(dirNormalized.y)) {
                dirBoxNormalized = dirNormalized.divide(Math.abs(dirNormalized.x));
            } else {
                dirBoxNormalized = dirNormalized.divide(Math.abs(dirNormalized.y));
            }
            setState(dirBoxNormalized.times(strength));
        } else {
            handlePosition = new Vector(0f, 0f);
            setState(new Vector(0f, 0f));
        }

        invalidate();
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        touchTracker.touchEvent(event);
        return true;
    }
}
