clear
clc

% Generate Non-Minimum Phase Filters
numFactors = 100; range_r = [0.5, 1.5]; 
randFilter = genNonMinPhaseFilt(numFactors, range_r);
[minPhaseFilter, r, lags, delay] = convert2minPhaseImp( randFilter );
% Generate DTFTs of Original and Minimum Phase Filters
% Note: The FFT (NOT THE DTFT) Will Be Same Between the Above Two Filters
w = -pi:pi/1000:pi; H_randFilter = freqz(randFilter, 1, w); 
H_minPhaseFilter = freqz(minPhaseFilter, 1, w); 
% Plot the Two Filters, DTFTs, and Pole-Zero Plots
subplot(3,3,1); stem(randFilter); title('Original Filter');
subplot(3,3,2); zplane(randFilter, 1); title('Original Pole-Zero Plot');
subplot(3,3,3); plot(w, abs(H_randFilter));
xlabel('\omega [rad/sample]'); ylabel('|H(e^{j\omega})|')
title('Original Filter Frequency Response');
subplot(3,3,4); stem(minPhaseFilter); title('Minimum-Phase Filter');
subplot(3,3,5); zplane(minPhaseFilter, 1); 
title('Minimum-Phase Filter Pole-Zero Plot');
subplot(3,3,6); plot(w, abs(H_minPhaseFilter));
xlabel('\omega [rad/sample]'); ylabel('|H(e^{j\omega})|')
title('Minimum-Phase Filter Frequency Response');
% Get Cross Correlation and Determine Peak of Cross Correlation
subplot(3,3,7:9); xlabel('Lag'); ylabel('Cross-Correlation');
plot(lags, real(r), 'r', lags, imag(r), 'b', lags, abs(r), 'k'); 
xlabel('Lag [samples]'); ylabel('Cross-Correlation');