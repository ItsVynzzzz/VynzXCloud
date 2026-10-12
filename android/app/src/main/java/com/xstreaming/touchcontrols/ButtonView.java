package com.xstreaming.touchcontrols;

import android.content.Context;
import android.content.res.Resources;
import android.graphics.Canvas;
import android.graphics.RectF;
import android.graphics.drawable.Drawable;
import android.util.AttributeSet;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import androidx.core.content.res.ResourcesCompat;
import com.xstreaming.R;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class ButtonView extends CustomView {
    private final ButtonHaptics haptics;
    private boolean buttonPressed = false;
    private ButtonPressedCallback buttonPressedCallback = null;
    private Drawable drawableIdle;
    private Drawable drawablePressed;
    private String buttonName = "";

    public interface ButtonPressedCallback {
        void onButtonPressed(boolean pressed);
    }

    public ButtonView(Context context) {
        this(context, null);
    }

    public ButtonView(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public ButtonView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);

        haptics = new ButtonHaptics(context);

        final android.content.res.TypedArray a = context.obtainStyledAttributes(
                attrs, R.styleable.ButtonView, defStyleAttr, 0);

        // 从XML属性获取drawable或按钮名称
        drawableIdle = a.getDrawable(R.styleable.ButtonView_drawableIdle);
        drawablePressed = a.getDrawable(R.styleable.ButtonView_drawablePressed);
        buttonName = a.getString(R.styleable.ButtonView_buttonName);

        a.recycle();

        if (buttonName != null && !buttonName.isEmpty() &&
                (drawableIdle == null || drawablePressed == null)) {
            loadDrawablesByName(context.getResources(), buttonName);
        }

        setClickable(true);
    }

    public void setButtonName(String name) {
        this.buttonName = name;
        if (name != null && !name.isEmpty()) {
            loadDrawablesByName(getResources(), name);
            invalidate();
        }
    }

    private void loadDrawablesByName(Resources res, String baseName) {
        try {
            int idleResId = res.getIdentifier(baseName, "drawable", getContext().getPackageName());
            int pressedResId = res.getIdentifier(baseName + "_pressed", "drawable", getContext().getPackageName());

            if (idleResId != 0) {
                drawableIdle = ResourcesCompat.getDrawable(res, idleResId, null);
            }
            if (pressedResId != 0) {
                drawablePressed = ResourcesCompat.getDrawable(res, pressedResId, null);
            }
        } catch (Exception e) {
            Log.e("ButtonView", "Error loading drawables for button: " + baseName, e);
        }
    }

    public void setDrawableIdle(Drawable drawable) {
        this.drawableIdle = drawable;
        invalidate();
    }

    public void setDrawablePressed(Drawable drawable) {
        this.drawablePressed = drawable;
        invalidate();
    }

    public boolean isButtonPressed() {
        return buttonPressed;
    }

    public interface ButtonStateCallback {
        void onPressIn();
        void onPressOut();
    }

    private ButtonStateCallback buttonStateCallback;

    public void setButtonStateCallback(ButtonStateCallback callback) {
        this.buttonStateCallback = callback;
    }

    private void setButtonPressed(boolean value) {
        boolean diff = buttonPressed != value;
        buttonPressed = value;
        if(diff) {
            if(value) {
                haptics.trigger();
                if(buttonStateCallback != null) {
                    buttonStateCallback.onPressIn();
                }
            } else {
                if(buttonStateCallback != null) {
                    buttonStateCallback.onPressOut();
                }
            }
            invalidate();
            if(buttonPressedCallback != null) {
                buttonPressedCallback.onButtonPressed(buttonPressed);
            }
        }
    }

    public void setButtonPressedCallback(ButtonPressedCallback callback) {
        this.buttonPressedCallback = callback;
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        Drawable drawable = buttonPressed ? drawablePressed : drawableIdle;
        if(drawable != null) {
            drawable.setBounds(
                    getPaddingLeft(),
                    getPaddingTop(),
                    getWidth() - getPaddingRight(),
                    getHeight() - getPaddingBottom());
            drawable.draw(canvas);
        }
    }

    private View bestFittingTouchView(float x, float y) {
        int[] thisLocation = new int[2];
        getLocationOnScreen(thisLocation);

        float touchX = thisLocation[0] + x;
        float touchY = thisLocation[1] + y;

        if(!(getParent() instanceof ViewGroup)) {
            return this;
        }

        ViewGroup parent = (ViewGroup)getParent();
        List<View> buttonViews = new ArrayList<>();

        for(int i = 0; i < parent.getChildCount(); i++) {
            View child = parent.getChildAt(i);
            if(child instanceof ButtonView) {
                buttonViews.add(child);
            }
        }

        if(buttonViews.isEmpty()) {
            return this;
        }

        buttonViews.sort(new Comparator<View>() {
            @Override
            public int compare(View v1, View v2) {
                float distance1 = calculateDistanceSquared(touchX, touchY, v1);
                float distance2 = calculateDistanceSquared(touchX, touchY, v2);
                return Float.compare(distance1, distance2);
            }
        });

        View bestView = buttonViews.get(0);
        return bestView != null ? bestView : this;
    }

    private float calculateDistanceSquared(float touchX, float touchY, View view) {
        int[] viewLocation = new int[2];
        view.getLocationOnScreen(viewLocation);

        float centerX = viewLocation[0] + view.getWidth() / 2f;
        float centerY = viewLocation[1] + view.getHeight() / 2f;

        float dx = touchX - centerX;
        float dy = touchY - centerY;

        return dx * dx + dy * dy;
    }

    private int trackedPointerId = -1;
    private ButtonView heldView = null;
    private final List<ButtonView> glideViews = new ArrayList<>();
    private final List<RectF> glideRects = new ArrayList<>();

    private void collectGlideTargets() {
        glideViews.clear();
        glideRects.clear();
        if (!(getParent() instanceof ViewGroup)) {
            return;
        }
        ViewGroup parent = (ViewGroup) getParent();
        float slop = 6f * getResources().getDisplayMetrics().density;
        int[] loc = new int[2];
        for (int i = 0; i < parent.getChildCount(); i++) {
            View child = parent.getChildAt(i);
            if (child instanceof ButtonView && child.getVisibility() == View.VISIBLE) {
                child.getLocationOnScreen(loc);
                glideViews.add((ButtonView) child);
                glideRects.add(new RectF(loc[0] - slop, loc[1] - slop,
                        loc[0] + child.getWidth() + slop, loc[1] + child.getHeight() + slop));
            }
        }
    }

    private ButtonView glideTargetAt(float sx, float sy) {
        ButtonView best = null;
        float bestDist = Float.MAX_VALUE;
        for (int i = 0; i < glideViews.size(); i++) {
            RectF r = glideRects.get(i);
            if (r.contains(sx, sy)) {
                float dx = sx - r.centerX();
                float dy = sy - r.centerY();
                float d = dx * dx + dy * dy;
                if (d < bestDist) {
                    bestDist = d;
                    best = glideViews.get(i);
                }
            }
        }
        return best;
    }

    private void handleGlide(float sx, float sy) {
        ButtonView target = glideTargetAt(sx, sy);
        if (target == null) {
            // Jari keluar dari semua tombol: tombol baru dilepas setelah menjauh 20dp (histeresis)
            if (heldView != null) {
                float hyst = 20f * getResources().getDisplayMetrics().density;
                int index = glideViews.indexOf(heldView);
                boolean keep = false;
                if (index >= 0) {
                    RectF r = glideRects.get(index);
                    keep = new RectF(r.left - hyst, r.top - hyst, r.right + hyst, r.bottom + hyst).contains(sx, sy);
                }
                if (!keep) {
                    heldView.setButtonPressed(false);
                    heldView = null;
                }
            }
            return;
        }
        if (target != heldView) {
            if (heldView != null) {
                heldView.setButtonPressed(false);
            }
            heldView = target;
            heldView.setButtonPressed(true);
        }
    }

    private void releaseGlide() {
        if (heldView != null) {
            heldView.setButtonPressed(false);
        }
        setButtonPressed(false);
        heldView = null;
        trackedPointerId = -1;
        glideViews.clear();
        glideRects.clear();
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        int action = event.getActionMasked();
        switch (action) {
            case MotionEvent.ACTION_DOWN:
            case MotionEvent.ACTION_POINTER_DOWN: {
                if (trackedPointerId != -1) {
                    return true; // jari kedua pada tombol yang sama diabaikan
                }
                View bestView = bestFittingTouchView(
                        event.getX(event.getActionIndex()),
                        event.getY(event.getActionIndex()));
                if (bestView != this) {
                    return false;
                }
                trackedPointerId = event.getPointerId(event.getActionIndex());
                collectGlideTargets();
                heldView = this;
                setButtonPressed(true);
                break;
            }
            case MotionEvent.ACTION_MOVE: {
                if (trackedPointerId == -1) {
                    break;
                }
                int index = event.findPointerIndex(trackedPointerId);
                if (index < 0) {
                    break;
                }
                int[] loc = new int[2];
                getLocationOnScreen(loc);
                handleGlide(loc[0] + event.getX(index), loc[1] + event.getY(index));
                break;
            }
            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_POINTER_UP:
            case MotionEvent.ACTION_CANCEL: {
                boolean mine = action != MotionEvent.ACTION_POINTER_UP
                        || event.getPointerId(event.getActionIndex()) == trackedPointerId;
                if (mine) {
                    releaseGlide();
                }
                break;
            }
        }
        return true;
    }
}
