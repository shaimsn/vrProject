clear
clc

% Generate Random Filters
numFactors = 100; range_r = [0.5, 1.5]; 
randFilter = genNonMinPhaseFilt(numFactors, range_r);
desiredDelayInSamples = 40; % MESS AROUND WITH THIS VALUE AND SEE WHAT HAPPENS
linPhaseFilter = convert2linPhaseImp( randFilter' , desiredDelayInSamples );
% Generate DTFTs of Original and Linear Phase Filters
% Note: The FFT (NOT THE DTFT) Will Be Same Between the Above Two Filters
w = -pi:pi/1000:pi; H_randFilter = freqz(randFilter, 1, w); 
H_linPhaseFilter = freqz(linPhaseFilter, 1, w); 
% Plot the Two Filters, DTFTs, and Pole-Zero Plots
subplot(2,3,1); stem(randFilter); title('Original Filter');
subplot(2,3,2); zplane(randFilter, 1); title('Original Pole-Zero Plot');
subplot(2,3,3); plot(w, abs(H_randFilter));
xlabel('\omega [rad/sample]'); ylabel('|H(e^{j\omega})|')
title('Original Filter Frequency Response');
subplot(2,3,4); stem(linPhaseFilter); title('Minimum-Phase Filter');
subplot(2,3,5); zplane(linPhaseFilter, 1); 
title('Minimum-Phase Filter Pole-Zero Plot');
subplot(2,3,6); plot(w, abs(H_linPhaseFilter));
xlabel('\omega [rad/sample]'); ylabel('|H(e^{j\omega})|')
title('Minimum-Phase Filter Frequency Response');