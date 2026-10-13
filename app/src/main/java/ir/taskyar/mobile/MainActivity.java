package ir.taskyar.mobile;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.ViewGroup;
import androidx.webkit.WebViewAssetLoader;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

/** Fully local Android application. No internet permission and no online entrypoints. */
public final class MainActivity extends Activity {
  private static final String START_URL="https://appassets.androidplatform.net/assets/www/index.html";
  private static final int PICK_FILE=103;
  private WebView browser;
  private ValueCallback<Uri[]> chooserCallback;
  private boolean pageLoaded=false;
  private final Handler handler=new Handler(Looper.getMainLooper());

  @Override public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().setStatusBarColor(Color.rgb(15,23,42));
    getWindow().setNavigationBarColor(Color.rgb(15,23,42));
    final WebViewAssetLoader loader=new WebViewAssetLoader.Builder()
      .addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
    browser=new WebView(this);
    browser.setBackgroundColor(Color.rgb(248,250,252));
    browser.setLayoutParams(new ViewGroup.LayoutParams(-1,-1));
    WebSettings settings=browser.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setAllowFileAccess(false);
    settings.setAllowContentAccess(true); // Android's system file chooser only
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    settings.setMediaPlaybackRequiresUserGesture(true);
    browser.addJavascriptInterface(new LocalBridge(),"DailyTasksNative");
    browser.setWebViewClient(new WebViewClient(){
      @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
        Uri uri=request.getUrl();
        if ("https".equals(uri.getScheme()) && "appassets.androidplatform.net".equals(uri.getHost()) &&
            uri.getPath()!=null && uri.getPath().startsWith("/assets/www/")) {
          WebResourceResponse result=loader.shouldInterceptRequest(uri);
          if(result!=null)return result;
        }
        // All other resource loads blocked (even if connectivity exists).
        return new WebResourceResponse("text/plain","UTF-8",
          new ByteArrayInputStream(new byte[0]));
      }
      @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
        return !START_URL.equals(request.getUrl().toString());
      }
      @Override public void onPageFinished(WebView view,String url) {
        pageLoaded=START_URL.equals(url);
        if(pageLoaded)sendOpenAddIfRequested();
      }
    });
    browser.setWebChromeClient(new WebChromeClient(){
      @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> cb,FileChooserParams params){
        if(chooserCallback!=null) chooserCallback.onReceiveValue(null);
        chooserCallback=cb;
        try {
          Intent intent=params.createIntent();
          startActivityForResult(intent,PICK_FILE);
          return true;
        }catch(Exception ex){chooserCallback=null;cb.onReceiveValue(null);return false;}
      }
    });
    setContentView(browser);
    browser.loadUrl(START_URL);
  }

  @Override protected void onNewIntent(Intent intent){
    super.onNewIntent(intent);
    setIntent(intent);
    sendOpenAddIfRequested();
  }
  private void sendOpenAddIfRequested(){
    if(browser==null || !pageLoaded || !getIntent().getBooleanExtra("openAdd",false))return;
    getIntent().removeExtra("openAdd");
    handler.postDelayed(()->{
      if(browser!=null)browser.evaluateJavascript("window.dispatchEvent(new Event('daily-tasks-open-add'));",null);
    },300);
  }
  @Override protected void onResume(){
    super.onResume();
    // Read changes made by the launcher widget while this activity was paused.
    handler.postDelayed(()->{
      if(browser!=null && pageLoaded && TaskyarWidgetProvider.consumeWidgetDirty(MainActivity.this)) {
        browser.evaluateJavascript("window.dispatchEvent(new Event('daily-tasks-native-refresh'));",null);
      }
    },350);
  }

  @Override protected void onActivityResult(int req,int result,Intent data){
    super.onActivityResult(req,result,data);
    if(req==PICK_FILE && chooserCallback!=null){
      chooserCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));
      chooserCallback=null;
    }
  }
  @Override public void onBackPressed(){
    if(browser!=null && browser.canGoBack())browser.goBack();
    else super.onBackPressed();
  }
  @Override protected void onDestroy(){
    if(browser!=null){browser.destroy();browser=null;}
    super.onDestroy();
  }
  private final class LocalBridge {
    @JavascriptInterface public String getState(){
      return getSharedPreferences(TaskyarWidgetProvider.PREFS,MODE_PRIVATE)
        .getString(TaskyarWidgetProvider.STATE_KEY,"");
    }
    @JavascriptInterface public void syncState(String json){
      try {
        JSONObject state=new JSONObject(json);
        if(state.optJSONArray("tasks")==null || state.optJSONArray("completedArchive")==null) return;
        if(json.length()>2_000_000)return;
        getSharedPreferences(TaskyarWidgetProvider.PREFS,MODE_PRIVATE).edit()
          .putString(TaskyarWidgetProvider.STATE_KEY,json).apply();
        handler.post(()->TaskyarWidgetProvider.refresh(MainActivity.this));
      }catch(Exception ignored){}
    }
    @JavascriptInterface public String getWidgetPrefs(){
      return getSharedPreferences(TaskyarWidgetProvider.PREFS,MODE_PRIVATE)
        .getString(TaskyarWidgetProvider.WIDGET_PREFS_KEY,"{}");
    }
    @JavascriptInterface public void syncWidgetPrefs(String json){
      try {
        JSONObject opts=new JSONObject(json);
        String theme=opts.optString("theme","light");
        if(!theme.matches("light|dark|glass|amoled|material"))return;
        int opacity=opts.optInt("opacity",95);
        if(opacity<40 || opacity>100)return;
        getSharedPreferences(TaskyarWidgetProvider.PREFS,MODE_PRIVATE).edit()
          .putString(TaskyarWidgetProvider.WIDGET_PREFS_KEY,opts.toString()).apply();
        handler.post(()->TaskyarWidgetProvider.refresh(MainActivity.this));
      }catch(Exception ignored){}
    }
  }
}
