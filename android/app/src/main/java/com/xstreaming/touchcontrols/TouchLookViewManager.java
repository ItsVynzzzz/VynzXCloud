package com.xstreaming.touchcontrols;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

public class TouchLookViewManager extends SimpleViewManager<TouchLookView> {

    public static final String REACT_CLASS = "TouchLookView";

    @Override
    @NonNull
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    @NonNull
    public TouchLookView createViewInstance(ThemedReactContext reactContext) {
        return new TouchLookView(reactContext);
    }

    @ReactProp(name = "speed", defaultFloat = 1.5f)
    public void setSpeed(TouchLookView view, float speed) {
        view.setSpeed(speed);
    }

    @ReactProp(name = "speedY", defaultFloat = 1f)
    public void setSpeedY(TouchLookView view, float speedY) {
        view.setSpeedY(speedY);
    }

    @ReactProp(name = "smoothing", defaultFloat = 0.1f)
    public void setSmoothing(TouchLookView view, float smoothing) {
        view.setSmoothing(smoothing);
    }

    @ReactProp(name = "antiDeadZone", defaultFloat = 0.25f)
    public void setAntiDeadZone(TouchLookView view, float antiDeadZone) {
        view.setAntiDeadZone(antiDeadZone);
    }

    @ReactProp(name = "invertY", defaultBoolean = false)
    public void setInvertY(TouchLookView view, boolean invertY) {
        view.setInvertY(invertY);
    }

    @Nullable
    @Override
    public Map<String, Object> getExportedCustomBubblingEventTypeConstants() {
        return MapBuilder.<String, Object>builder()
                .put("onTouchLookChange",
                        MapBuilder.of(
                                "phasedRegistrationNames",
                                MapBuilder.of("bubbled", "onTouchLookChange")
                        )
                )
                .build();
    }
}
