function [linPhaseImp] = convert2linPhaseImp(filter, delayInSamples)
%CONVERT2LINPHASEIMP Get Linear Phase Filter and Delay
% [minPhaseImp, x_corr, lags, delay] = convert2minPhaseImp( filter )
%   filter -- Filter To Convert to Minimum-Phase Representation
%   delayInSamples -- Desired Delay of Linear Phase Filter in Samples (40)
%   linPhaseImp -- Minimum-Phase Representation of Filter

% Get Magnitude Response of FIR Filter
% We want the Linear Phase Filter to Have this Magnitude Response
absH = abs(fft(filter)); N = length(absH);

% Center the Linear Phase Filter Around a Fixed Delay
phase_term = exp(1i.*delayInSamples.*(2*pi/N).*(0:N-1))';

% Use IFFT to Get Linear Phase Filter Back in the Time Domain
linPhaseImp = real(ifft(absH.*phase_term));

end