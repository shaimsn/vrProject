function [minPhaseImp, x_corr, lags, delay] = convert2minPhaseImp( filter )
%CONVERT2MINPHASEIMP Get Minimum Phase Filter and Delay
% [minPhaseImp, x_corr, lags, delay] = convert2minPhaseImp( filter )
%   filter -- Filter To Convert to Minimum-Phase Representation
%   minPhaseImp -- Minimum-Phase Representation of Filter
%   x_corr -- Cross Correlation of Hilbert-Transformed filter and minPhaseImp
%   lags -- Lags of Calculated Cross-Correlation
%   delay -- Lag at which Magnitude of Cross-Correlation is Maximized

% Convert to Minimum Phase Filter
[~, minPhaseImp] = rceps(filter); 

% Get Cross Correlation and Determine Peak of Cross Correlation
[x_corr, lags] = xcorr(hilbert(filter), hilbert(minPhaseImp));
delay = lags(abs(x_corr) == max(abs(x_corr)));

end

