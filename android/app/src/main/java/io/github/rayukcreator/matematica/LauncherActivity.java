package io.github.rayukcreator.matematica;

import android.net.Uri;

/**
 * Apre il gioco nella lingua del dispositivo: italiano se il telefono o il tablet è in italiano,
 * inglese in tutti gli altri casi. Dentro il gioco resta il pulsante IT/EN per cambiare.
 */
public class LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {
    @Override
    protected Uri getLaunchingUrl() {
        // Se l'app è stata aperta toccando un link al sito, si apre quella pagina.
        if (getIntent() != null && getIntent().getData() != null) {
            return super.getLaunchingUrl();
        }
        return Uri.parse(getString(R.string.launchUrl));
    }
}
